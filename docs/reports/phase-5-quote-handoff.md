# Phase 5 report — URL-param prefill, entry points & Sparkle quote handoff

Status: **complete**. Both quality gates pass.

```
npx tsc --noEmit  -> clean (exit 0) across every file touched
npx vitest run    -> 4 files, 81 tests, all pass (includes my 13 new brain tests)
```

`vite build` was intentionally **not** run (shared `dist/`). No new dependencies,
no git commands.

## What was built

### Feature 1 — Booking wizard URL-param prefill (`src/pages/booking/BookingPage.tsx`)

`/booking` now reads query params and prefills the wizard, applied **once** after
the catalogue loads (guarded by a `useRef`, so state updates never re-apply it).
The URL is never rewritten, so links stay shareable.

The param contract, exactly as implemented:

| Param | Value | Behaviour |
|---|---|---|
| `services` | comma-separated service **slugs** | Each is matched against live active services; unknown/inactive slugs are dropped silently; duplicates de-duped; valid ones are preselected. |
| `band` | a `property_bands.code` | Set only if it matches a live band code. |
| `frequency` | a `frequencies.code` | Set only if it matches a live frequency code (else the default `every_4_weeks` stays). |
| `postcode` | URL-encoded postcode | Trimmed and written to the address; the existing live area-match then runs automatically (via the `matchedArea` memo). |

Starting step:
- **zero valid services** → behave exactly as today: step 1, nothing selected (band/frequency/postcode are *not* applied in this case).
- **services only** → step 2 (Property).
- **services + a valid band** → step 3 (Address).
- Never deeper than step 3 — address always needs manual input. `furthest` is set
  to the starting step so the stepper lets the visitor navigate back and edit.

Final-step submit still re-validates every step, so a deep-linked start can't
submit an inconsistent booking.

### Feature 2 — Entry points

- **`src/pages/ServiceDetail.tsx`** — "Book this clean" now links to
  `/booking?services=<slug>`. I also updated the sidebar's "Get your exact quote"
  button to the same prefill URL (same service context, same page; leaving one of
  two identical CTAs un-prefilled would be inconsistent). Flagged for review below.
- **`src/pages/Pricing.tsx`** — each matrix row's service name is now a real
  `<Link>` to `/booking?services=<slug>`, plus a small per-row **"Quote this →"**
  link beneath it (`aria-label="Quote <service>"`). Both are proper anchors
  (react-router `Link`), not row-level click handlers, and are keyboard-focusable
  with the global amber focus-visible ring. The page's main "Get an instant quote"
  CTAs are unchanged.
- `/services` cards were left untouched (out of my ownership; still go to the
  detail page).

### Feature 3 — Sparkle chat → pre-filled quote handoff

Extended the chat contract with an optional
`quote_draft?: { services: string[]; band_code?; frequency_code?; postcode? }`:

- **`netlify/functions/lib/types.ts`** + **`src/components/chat/types.ts`** — added
  the `QuoteDraft` type and `quote_draft?` on `ChatResponse` (and `quoteDraft?` on
  the client `DisplayMessage`).
- **`netlify/functions/chat.ts`** — added `quote_draft` to the structured-output
  JSON schema (`services` required array of strings; others optional strings;
  `additionalProperties: false`; the object itself optional). The system prompt now
  lists the band and frequency **codes** (code = label) and the service-slug rule,
  plus a QUOTE HANDOFF section: gather missing info one thing at a time
  (service → bedrooms → frequency → postcode), infer codes ("3 bed semi" →
  `band_3`, "monthly" → `every_4_weeks`, …), never block on missing fields, and emit
  a partial `quote_draft` + a `/booking` link once ≥1 service is known and the
  visitor wants to proceed. Server-side, `coerceAiResponse` runs the model's draft
  through the shared `validateQuoteDraft` before returning it.
- **`netlify/functions/lib/brain.ts`** (rules fallback) — on quote/booking intent
  (the pricing and booking branches) it extracts from the **full** visitor history:
  services (existing synonym matching, all matches), a bedroom count
  (`(\d+)\s*(?:-|\s)?bed` → 1–2 `band_1_2`, 3 `band_3`, 4 `band_4`, ≥5 `band_5p`),
  a frequency word (4-week/monthly/regular → `every_4_weeks`; 8-week →
  `every_8_weeks`; one-off/once → `one_off`), and an outcode via the existing regex.
  The exported `validateQuoteDraft(draft, data)` is the single source of truth used
  by **both** paths: it filters services to real active slugs, drops invalid
  band/frequency codes, keeps the postcode only if it matches a UK-postcode-ish
  regex, and returns `undefined` if no service survives.
- **`netlify/functions/lib/brain.test.ts`** — 13 new vitest cases (10 extraction via
  `answerWithRules` + 3 direct `validateQuoteDraft`), including the required
  no-services-no-draft case, a non-quote-intent-no-draft case, 5+ bedroom → top
  band, outcode extraction, a full multi-service draft assembled across turns, and
  validation dropping invalid band/frequency/postcode.
- **`src/components/chat/ChatWidget.tsx`** — when a response carries a `quote_draft`,
  a distinct **amber "Continue your quote"** button renders *above* the ordinary
  link buttons. It builds `/booking?…` including only present fields
  (postcode/values URL-encoded via `URLSearchParams`) and navigates through the
  existing close-then-navigate path. The draft is persisted with the message in
  `sessionStorage` (it rides along in the stored `DisplayMessage`) and re-validated
  on render, exactly like links.

## Key decisions

- **`validateQuoteDraft` is shared** between the AI path (`chat.ts`) and the rules
  path (`brain.ts`) so "the same rules" are genuinely the same code — one regex,
  one slug/code filter, one empty-drops-the-draft rule.
- **The rules brain attaches a draft on both the booking and pricing branches.**
  `validateQuoteDraft` only returns something when ≥1 real service is present, so
  generic questions ("what are your prices?") never get a spurious draft, while
  a service-specific price question offers a helpful handoff. Existing pricing/booking
  tests are unaffected (they don't assert on `quote_draft`).
- **Extraction reads user turns only**, not assistant turns — so an outcode or
  bedroom count the *bot* mentions as an example can't leak into the draft.
- **Bare "once" is excluded** from the one-off frequency match ("once a month"
  means monthly, not a one-off); I match `one-off`/`one time`/`just once`/`once off`.
  I also kept the frequency synonyms tight to the SPEC (dropped ambiguous
  "bi-monthly").
- **Postcode regex is deliberately lenient** (`^[A-Z]{1,2}[0-9][A-Z0-9]?(\s*[0-9][A-Z]{2})?$`,
  case-insensitive) so it accepts both an outcode ("SS14") and a full postcode
  ("SS14 1AA") — the wizard prefix-matches either.

## For review

1. **"Get your exact quote" also prefilled.** I prefilled both service-detail CTAs,
   not just "Book this clean". If you want the sidebar button to stay a generic
   `/booking` link, it's a one-line revert.
2. **Amber "Continue your quote" button vs. "one amber per viewport".** Inside the
   open chat panel the amber launcher is largely occluded, and BRAND reserves amber
   for the primary action — this *is* the panel's primary action. If you'd rather it
   not double up with the launcher, a teal-deep filled variant would still read as
   primary against the white link buttons.
3. **No visual/browser verification.** Per the no-dev-server / no-build constraint,
   the new links, the prefill flow, and the chat button are typecheck- and
   unit-test-clean but have not been eyeballed. Worth a quick pass on integration —
   especially the Pricing matrix row (two stacked links in the sticky first column)
   and a real Sparkle handoff round-trip.
4. **No new placeholders.** This feature adds no visible `[PLACEHOLDER]` copy and no
   new config/infra TODO, so `docs/PLACEHOLDERS.md` was intentionally left unchanged.

## Untouched (respected hard limits)

No changes to `App.tsx`, `index.css`, `package.json`, shared `lib/`/`ui/`, brand or
site components, admin, `netlify.toml`, or `supabase/**`. Only the owned files
listed above plus this report. No new dependencies, no git commands, no dev server,
no `vite build`.
