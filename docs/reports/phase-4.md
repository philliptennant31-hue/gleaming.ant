# Phase 4 report — "Sparkle", the site assistant

Status: **complete**. Phase-4 code passes its quality gates (see caveat on the
concurrent admin file below).

```
npx tsc --noEmit  -> all Phase-4 files clean (0 errors in netlify/functions/** and src/components/chat/**)
                     1 pre-existing error remains in src/pages/admin/AdminLoginPage.tsx (Phase 3, not my scope)
npx vitest run    -> 3 files, 59 tests, all pass (includes my 24 brain tests)
```

## What was built

**Serverless function (`netlify/functions/`)**

- `lib/types.ts` — server-side domain + chat wire types, kept local so the
  function bundle has zero dependency on `src/` (clean esbuild bundle, strict
  ownership).
- `lib/data.ts` — `loadBusinessData()`: fetches services (active), service_prices,
  property_bands, frequencies, bundle_discounts, service_areas (active), faqs
  (active) and site_settings from Supabase **REST** with plain `fetch` + the
  `apikey`/`Authorization` headers (no supabase-js). All fetches run in parallel
  behind a single **5s** `AbortController` timeout; every table degrades
  independently to `[]` (or default settings) on failure. URL/key fall back to the
  public-by-design project values.
- `lib/brain.ts` — `answerWithRules(messages, data): ChatResponse`: a **pure,
  deterministic** intent matcher (greeting; per-service by name/synonym; price;
  booking; areas incl. inline UK-outcode regex + longest-prefix area match;
  frequency; insurance; payment; contact/human; services list; FAQ fuzzy match via
  normalised token overlap; fallback). Every branch returns the exact SPEC shape
  with ≤2 links and ≤3 suggested replies, tagged `source: 'rules'`. Also exports
  `isRoutePath()` (route-map guard reused by `chat.ts`).
- `lib/brain.test.ts` — 24-case vitest suite over a fixture catalogue: greeting,
  each major intent, postcode inside (core) / surrounding (surcharge) / outside,
  price question, placeholder-safety, FAQ fuzzy match, unknown→fallback, plus a
  contract test asserting the SPEC shape (valid route paths, link/suggestion caps,
  `source`) across many probes and against empty data.
- `chat.ts` — Netlify v2 handler (`export default async (req: Request)`). POST-only
  (405 otherwise); validates body per SPEC (≤12 messages, each ≤600 chars, roles
  `user|assistant`, else 400 JSON). Loads data → if `ANTHROPIC_API_KEY` is set,
  tries Claude → on **any** error falls back to `answerWithRules` → always 200.

**Claude call** (built exactly to the current API surface, cross-checked against the
`claude-api` skill):
- `new Anthropic()` (reads the env key), `model: process.env.CHAT_MODEL || 'claude-opus-4-8'`,
  `max_tokens: 700`.
- **No** `temperature`/`top_p`/`top_k`/`thinking` — these 400 on Opus 4.8.
- Structured output forced via `output_config: { format: { type: 'json_schema', schema } }`
  (schema per SPEC). Confirmed against the installed SDK types
  (`@anthropic-ai/sdk@0.112.1`): `output_config.format` and `Anthropic.APIError`
  are present.
- System prompt = Sparkle identity + serialised business data (services with
  per-band prices, frequencies, discounts, areas, FAQs, contact) + the route map +
  strict rules (Gleaming-Ant topics only; never invent prices/policies; links from
  the route map only; ≤120 words; UK friendly-pro tone; recommend `/booking`).
- History truncated to the last 8 turns. Text block parsed as JSON; shape
  validated and link paths filtered to the route map; tagged `source: 'ai'`.
  Wrapped in try/catch on `Anthropic.APIError` (and any other throw) → rules
  fallback, so model issues never surface as a 500.

**Widget (`src/components/chat/`)**

- `types.ts` — client chat/view types.
- `ChatWidget.tsx` — replaces the Phase-1 stub. Floating **amber** launcher
  (bottom-right, Sparkle icon, `aria-label`, hidden on `/admin` via `useLocation`)
  opening a **380px** card / mobile full-width bottom sheet: header "Sparkle — here
  to help" + close; message list (user right/amber-tint, assistant left/pane-tint,
  auto-scroll, `role="log"` `aria-live`); reduced-motion-safe three-dot typing
  indicator; suggested-reply chips (last message); link buttons via
  `useNavigate` (close on navigate); textarea composer (Enter submits, Shift+Enter
  newline, 600-char cap, auto-grow); greeting + starter suggestions on first open;
  `sessionStorage` transcript persistence; Esc + click-away close; `role="dialog"`
  `aria-modal`, focus moved in on open and restored to the launcher on close, focus
  trapped while open. Calls `fetch('/api/chat', …)`; on network failure or non-200
  shows a friendly inline notice linking `/faq` and `/contact`.

## Chatbot running costs (rough)

Per user message the model sees roughly: system prompt (identity + serialised
catalogue + rules) ≈ **1.8–2.5k input tokens**, plus up to 8 turns of history
(usually a few hundred tokens), and produces ≈ **200–300 output tokens** (reply
capped at ~120 words inside a small JSON envelope; `max_tokens` 700).

| Model (`CHAT_MODEL`) | Input $/1M | Output $/1M | Est. per message |
|---|---|---|---|
| `claude-opus-4-8` (default) | $5 | $25 | **≈ $0.015–0.02** (~1.5–2p) |
| `claude-haiku-4-5` | $1 | $5 | **≈ $0.003–0.004** (~0.3p) — ~5× cheaper |

Both models support structured outputs, so switching is a one-line env change with
no code impact. **The owner decides**: set `CHAT_MODEL=claude-haiku-4-5` in the
Netlify UI to cut cost materially if Opus-tier quality isn't needed. (Note: our
system prompt sits ~2k tokens, below Opus's 4,096-token prompt-cache minimum, so
prompt caching wouldn't engage without enlarging/pinning it — not worth it at this
size. With no `ANTHROPIC_API_KEY` set, the rules brain runs and cost is £0.)

## Design decisions

1. **Launcher uses the Sparkle star, not the AntMascot.** BRAND reserves the ant
   for "exactly two places" (hero + booking stepper); the SPEC allowed either, so I
   kept the mascot scarce and used the on-brand 4-point sparkle (also the
   assistant's namesake). Easy to swap to `AntMascot` if you'd prefer — flag for
   review.
2. **Function bundle is fully self-contained** — local `types.ts` and inline
   postcode/area logic; nothing imported from `src/lib` (per the SPEC's isolation
   note and clean esbuild bundling).
3. **Placeholder hygiene.** `[PLACEHOLDER: …]` markers are stripped from any
   surfaced FAQ answer / service description / price note; contact channels are
   only quoted when real; the rules brain and the AI system prompt never emit a raw
   placeholder — they point to `/contact` and say the team will confirm.
4. **Graceful degradation at every layer**: data fetch → empty arrays; Claude →
   rules; widget network/non-200 → inline `/faq` + `/contact` notice. Locally
   (Vite dev without `netlify dev`) `/api/chat` 404s and the widget shows that
   notice — expected; production works via the existing `netlify.toml` `/api/*`
   redirect (read-only, untouched).
5. **Greeting/error messages are UI-only** (`local: true`) and excluded from the
   `/api/chat` payload, so the history sent to Claude always starts with a real
   user turn.
6. **Accessibility**: dialog semantics, focus move-in + restore + trap, Esc,
   click-away, `aria-live` message log, and a `motion-reduce`-safe typing indicator
   (also covered by the global `prefers-reduced-motion` reset in `index.css`).

## Notes for the reviewer

1. **`tsc --noEmit` is not globally green yet** because of one pre-existing error
   in `src/pages/admin/AdminLoginPage.tsx` (Phase 3, `'sent'` vs `'sending'`
   comparison). That file is outside Phase-4 ownership (admin/**), so I did not
   touch it — every `netlify/functions/**` and `src/components/chat/**` file is
   clean. The orchestrator/Phase-3 agent should resolve the admin error before the
   integration build.
2. **`ANTHROPIC_API_KEY` must be set in the Netlify UI** to enable AI replies;
   without it the assistant runs on the rules brain (fully functional, free).
   `CHAT_MODEL` is optional (default `claude-opus-4-8`). Both logged in
   `docs/PLACEHOLDERS.md` → Chatbot.
3. **No dev server / browser run** (per instructions). The widget's SVG icons,
   layout, focus trap and mobile bottom-sheet are built carefully but have **not**
   been eyeballed — worth a visual + keyboard pass during integration.
4. **Untouched hard limits**: `App.tsx`, `Layout.tsx` (already mounts
   `<ChatWidget/>`), `index.css`, `package.json`, `netlify.toml`, shared `lib/ui`,
   `booking/**`, `admin/**`. No new dependencies. No git commands. No
   `build`/`vite build` run.
