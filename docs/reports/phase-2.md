# Phase 2 report — Booking wizard & pricing/availability engines

Status: **complete**. All Phase-2 quality gates pass.

```
npx tsc --noEmit  → all Phase-2 files clean (one pre-existing error remains in
                    src/pages/admin/AdminLoginPage.tsx — a Phase-3 file, not
                    owned by Phase 2; see "For review" below)
npx vitest run    → 35/35 Phase-2 tests pass (pricing 23, availability 12)
```

`npm run build` / `vite build` was intentionally **not** run (concurrent agents
share `dist/` — the orchestrator builds after integration, per the task brief).

## What was built

### Pure engines (fully unit-tested, no I/O)

- **`src/lib/pricing.ts`** — `computeQuote(input, data)` returning the full
  breakdown (`lines, subtotal, discountPercent, discountAmount, surcharge,
  areaName, outsideArea, total, durationMinutes`). Implements the SPEC algorithm
  exactly: band-price lookup with `base_price` fallback, frequency multiplier
  applied **only** to services with `supports_frequency`, best bundle discount
  where `min_services ≤ count`, longest-prefix postcode → area match with an
  `outsideArea` flag, surcharge, and 2dp rounding at every step. Also exports
  `round2`, `normalisePostcode`, and `matchArea` (used by the wizard's live
  area feedback).
- **`src/lib/availability.ts`** — `generateSlots(params)` (open→close by the
  settings interval, job must fit before close, min-notice window from `now`,
  overlap-trims `get_unavailable_slots` ranges, closed days → none) and
  `listSelectableDates(params)` (horizon-bounded, drops closed/notice/fully-
  blocked days). Time/date helpers exported too. `now` is injectable for
  deterministic, timezone-safe tests.

### Tests

- **`src/lib/__tests__/pricing.test.ts`** (23) — fixtures mirror the seed.
  Covers single service, base_price fallback, frequency applied vs not,
  1/2/3-service discounts, the discount-rounding boundary (87.75 → 8.78 → 78.97),
  longest-prefix matching (`SS15`→Basildon, `SS17`→Stanford-le-Hope not the broad
  `SS`, `CM3`→South Woodham Ferrers not `CM`, `SS9`/`CM99`→Surrounding surcharge,
  unknown→`outsideArea`), core vs non-core surcharge, empty/unknown selection,
  line ordering, unknown frequency.
- **`src/lib/__tests__/availability.test.ts`** (12) — slot stepping, duration
  fits-exactly-at-close vs overflow, closed Sunday, overlap trimming (keeps
  flush-adjacent slots), min-notice cut-off (boundary inclusive), horizon, and
  fully-blocked-day removal in `listSelectableDates`.

### Booking wizard — `src/pages/booking/` + `src/components/booking/`

`BookingPage.tsx` rewritten as the 5-step wizard orchestrator; new components:

- **`Stepper.tsx`** — progress stepper with the `AntMascot` gliding to the
  active step (subtle `left` transition + idle bob; both stilled by the global
  `prefers-reduced-motion` reset). Completed steps are clickable to go back;
  active step is the one sanctioned amber highlight alongside the primary button.
- **`QuotePanel.tsx`** — the persistent live quote: sticky sidebar card on
  desktop, collapsible bottom bar → sheet on mobile (Esc/backdrop close). Its
  inner `QuoteContent` is reused in step 5's inline recap.
- **`StepServices`** (multi-select cards, "from" price + duration + regular
  badge), **`StepProperty`** (property bands + frequency — frequency only shown
  when a selected service supports it, default `every_4_weeks`, with the
  regular-vs-one-off explainer; native radios for full a11y), **`StepAddress`**
  (line1 required + postcode required, optional line2/city, live area feedback:
  named-area / surcharge / outside-area reassurance), **`StepDateTime`** (loads
  `get_unavailable_slots` via RPC, drives the availability lib, calendar-style
  date chips + slot buttons, self-heals selection when availability changes),
  **`StepReview`** (details form + editable summary + inline itemised quote).
- **`submit.ts`** — `generateReference()` (`'GA-'` + 6 crypto-random A–Z/2–9) and
  `insertBooking()` (insert **without** `.select()` for a minimal return, retry
  **once** on `23505` with a fresh reference; `status` omitted → DB default).
- **`BookingConfirmedPage.tsx`** rewritten — reads router state (redirects to
  `/booking` if absent), restrained celebration with amber sparkles, big mono
  reference (with copy button), full breakdown, "what happens next", home/services
  links.

Live quote is visible from step 1 onward (uses the `base_price` fallback as the
provisional "from" quote before a band is chosen, with a note saying so).

## Key decisions

- **Provisional quote before band selection.** `bandCode` starts `''`; the
  pricing engine's documented `base_price` fallback then yields a "from" quote
  from step 1, so the live panel is populated immediately without special-casing.
- **`frequencyCode` defaults to `every_4_weeks`** and is only surfaced/edited when
  a selected service supports frequency. On submit, `frequency` is stored as the
  chosen code, or `'one_off'` when nothing supports frequency (matches the DB
  default and reality of a one-off job).
- **Final-step validation re-checks all steps** and jumps to the first problem,
  so stepper back-navigation + editing can't submit an inconsistent booking.
- **Postcode stored upper-cased & trimmed** on the booking; matching itself is
  space/case-insensitive via `normalisePostcode`.
- **Rounding** uses a shared `round2` (`Math.round((n + EPSILON) * 100) / 100`);
  verified against the seed's real multiplier/percent values.
- **Accessibility**: one `h1` per page, `fieldset/legend` groupings, native
  radios for band/frequency, `aria-pressed` service cards, `role="radiogroup"`
  date/time grids, labelled inputs with wired errors, keyboard-operable stepper,
  and full reduced-motion compliance.

## For review

1. **Concurrent Phase-3 typecheck error (not mine).**
   `src/pages/admin/AdminLoginPage.tsx(114,47)` currently fails
   `tsc --noEmit` (a `'sent' vs 'sending'` comparison). It's owned by the Phase-3
   admin agent and I did **not** touch it. Every Phase-2 file typechecks clean;
   the whole-project `tsc` will go green once Phase 3 fixes that line.
2. **No live/browser verification** (per the "no dev server / no build" limit).
   SVGs, the walking-ant stepper, the sticky/collapsible quote panel and the
   wizard flow are built to the kit and typecheck + unit-test clean, but have not
   been eyeballed in a browser — worth a visual pass on integration, especially
   the mobile quote bar's stacking and the stepper ant alignment.
3. **New placeholders** appended to `docs/PLACEHOLDERS.md` (Booking section):
   confirmation channel and payment-timing copy on the confirmation screen.
4. **Frequency multiplier semantics**: the provisional pre-band quote and the
   quote panel show discounts on the "from" prices; the "from" note is present to
   set expectations. Confirm that's the desired behaviour vs. hiding discounts
   until a band is chosen.
5. **RPC dependency**: `StepDateTime` calls `get_unavailable_slots(from_date,
   to_date)` and remounts (re-fetches) each time step 4 is entered — intentional,
   to keep availability fresh, but flagging in case a single up-front fetch is
   preferred.

## Untouched (respected hard limits)

No changes to `App.tsx`, `index.css`, `package.json`, shared `lib/`/`ui/` files,
`netlify/**`, `admin/**`, `chat/**`, or `supabase/**`. No new dependencies, no
git commands, no dev server, no `vite build`. Only `docs/reports/phase-2.md` was
created and `docs/PLACEHOLDERS.md` appended-to, alongside the owned
`src/pages/booking/**`, `src/components/booking/**`, `src/lib/pricing.ts`,
`src/lib/availability.ts`, and `src/lib/__tests__/**`.
