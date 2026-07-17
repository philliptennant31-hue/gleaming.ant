# Phase 8: copy polish

A full pass over every user-facing string to remove em dashes and stock AI phrasing,
following the owner's review of the live site. The voice target is unchanged: friendly
local pro, plain-spoken, contractions, British English, short sentences. Facts (prices,
areas, hours, service names) and every `[PLACEHOLDER: …]` marker were preserved exactly.

The concurrent brand agent's `src/components/brand/**` was left untouched.

## Approach

- Removed every em dash from user-facing copy by restructuring, not substituting: a
  comma, a colon, or a full stop and a fresh sentence, whichever read most naturally.
- While inside each edited string, flattened AI tells where present. The main one on
  this site was a stacked "no obligation, no pushy calls", rebuilt as a plain sentence.
- Empty-value indicators that displayed a bare `—` (table cells, `formatDuration`
  fallback, review rows) were switched to a plain hyphen `-` so nothing user-facing
  trips the em-dash grep.
- En dashes that are genuine ranges (hours `8:00 – 17:00`, `1–2 bedrooms`) were kept,
  as instructed.
- `[PLACEHOLDER: …]` markers were kept verbatim, including any em dash inside the
  marker text. See "Placeholder markers" below.

## Files touched

| Area | Files | Notes |
|---|---|---|
| Site pages | `Home`, `Services`, `About`, `Pricing`, `Contact`, `FAQ`, `Areas`, `NotFound` | Hero, section leads, step copy, CTAs, form placeholder, success heading. |
| Booking wizard | `BookingPage`, `StepServices`, `StepProperty`, `StepAddress`, `StepReview`, `StepDateTime`, `Stepper`, `QuotePanel`, `BookingConfirmedPage` | Step leads, area feedback, review notes, the "what happens next" list, plus 4 empty-value glyphs in the review summary. |
| Admin UI | `ServiceModal`, `AdminShell`, `AdminLoginPage`, `ServicesPage`, `SettingsPage`, `MessagesPage`, `DashboardPage`, `BookingsPage`, `AreasPage`, `AvailabilityPage` | Error toasts, aria-labels, the mailto subject, magic-link copy, and the bare-dash empty cells in the tables. |
| Shared | `components/ui/states.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `components/site/HeroArt.tsx`, `components/chat/ChatWidget.tsx`, `lib/format.ts` | Default error message, home aria-labels, footer blurb, badge title, chat fallback, duration fallback. |
| `index.html` | meta description, JSON-LD `description` | og/twitter descriptions were already clean. |
| Chatbot | `netlify/functions/lib/brain.ts` (9 replies), `netlify/functions/chat.ts` | Rules replies rewritten; added STRICT RULE `- Never use em dashes. Use commas or separate sentences.` and swept the prompt's own strings. `notify.ts` was swept and was already clean. |
| Tests | `netlify/functions/lib/brain.test.ts` | 4 fixtures updated to match the new seed copy. `notify.test.ts` already asserts emails contain no em dashes. |
| Database | `supabase/migrations/001_init.sql`, `supabase/migrations/002_copy_polish.sql` (new) | 001 seed text updated so fresh installs equal production; 002 rewrites the live rows. |
| Docs | `docs/BRAND.md` | Two new Voice bullets codifying the rule; also fixed the one em dash already living in that section. |

Rough volume: about 80 copy strings rewritten across code, `index.html` and the seed,
plus 15 bare `—` empty-value glyphs converted to `-`.

## The database copy

`002_copy_polish.sql` rewrites the live rows the frontend actually reads. Rows are
matched by `slug` / `question` (never by id), single quotes are SQL-escaped (`''`), and
`[PLACEHOLDER: …]` markers are kept verbatim inside the new text:

- `services.short_description` for window, fascia, conservatory, solar and pressure.
- `services.long_description` for gutter and conservatory.
- `services.price_note` for conservatory, solar and pressure.
- `faqs.answer` for the insured, quote, at-home, rain and frequency questions.

`001_init.sql` was updated to the identical text so a fresh install matches production.
The orchestrator runs 002 against the live database. (Verified in the browser: the
home-page service cards still render the old em-dash copy because they read live
Supabase, which 002 has not yet been applied to.)

## Notable rewrites (before → after)

1. Home hero:
   `keeping Essex homes bright — reliable, friendly and fully insured`
   → `keeping Essex homes bright. Reliable, friendly and fully insured`

2. Home final CTA (em dash + stacked negatives flattened):
   `Get a free, instant quote in under a minute — no obligation, no pushy calls.`
   → `Get a free, instant quote in under a minute. No obligation, and we won't hassle you with calls.`

3. Chatbot area reply (`brain.ts`):
   `Good news — we cover ${area.name}! Pop your details into the booking tool…`
   → `Good news, we cover ${area.name}! Pop your details into the booking tool…`

4. FAQ seed answer (rain):
   `Light rain doesn't affect a professional clean — your windows will still dry clear.`
   → `Light rain doesn't affect a professional clean, and your windows will still dry clear.`

5. Solar service short description (seed + 002):
   `Clean panels generate more — protect your investment.`
   → `Clean panels generate more and protect your investment.`

## Placeholder markers

Five `[PLACEHOLDER: …]` markers in `src` contain an em dash inside the marker text
(About x2, Home, Privacy, BookingConfirmedPage). These were kept verbatim, as the brief
requires. They are developer/owner scaffolding that gets replaced with real content, not
finished site copy, so they carry no AI-tell risk on the live site. Live copy that sat
next to a placeholder (for example "…by message — [PLACEHOLDER: …]") was still cleaned.

## Quality gates

- `npx tsc --noEmit`: clean, no output.
- `npx vitest run`: 81 passed, 4 files.
- `git grep -n "—" -- src netlify index.html`: no user-facing product copy remains. Every
  hit is one of: a code comment, a test `describe()` title, a `console.error` server log,
  a `src/components/brand/**` file (out of scope), or a `[PLACEHOLDER: …]` marker kept
  verbatim.
- Spot-checked the rendered Home and About pages: code-side copy reads clean, placeholders
  render verbatim, no console errors.
- `vite build` was not run, per the brief.
