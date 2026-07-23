# Content edits — public voice rule (em dashes in live rows)

**Owner action required. No code change and no migration; these are live content edits.**

The public voice rule (owner mandate) says no em dashes (the `—` character) in
any customer-visible text: rewrite with a comma or a full stop. The site code,
chat brain and system prompt were fixed in code on 2026-07-23. The rows below
are **live database content** that still carries an em dash, each one inside a
`[PLACEHOLDER: ...]` marker that migration `002` deliberately left verbatim.
They were seeded by `001` / `002` and were **not** overwritten by `003`, so they
are still the live values.

These rows are inferred from the applied migration history (`001` → `002` →
`003`). **Do not add a new migration** and **do not touch anything else** — edit
these values in place. Verify each against the live table before pasting, in
case an admin edit has changed the text since `003`.

## How to apply

Apply these in **Supabase → Table editor** (or the SQL editor). For each row
below, find it by the exact identifier shown, then replace the whole cell with
the **New text**. The only change in every case is the em dash becoming a comma;
the wording, the `[PLACEHOLDER]` marker and every factual claim are otherwise
untouched. Leave all other columns unchanged.

---

## 1. `services` — `slug` = `window-cleaning`, column `long_description`

**Current:**

> Our core service. We clean your windows, frames, sills and doors for a streak-free finish that lasts. Choose a regular 4- or 8-weekly clean for the best price, or book a one-off spruce-up. [PLACEHOLDER: confirm method — e.g. pure water reach & wash system]

**New:**

> Our core service. We clean your windows, frames, sills and doors for a streak-free finish that lasts. Choose a regular 4- or 8-weekly clean for the best price, or book a one-off spruce-up. [PLACEHOLDER: confirm method, e.g. pure water reach & wash system]

---

## 2. `services` — `slug` = `gutter-cleaning`, column `long_description`

(Seeded as `gutter-clearing` in `001`, re-set in `002`, renamed to
`gutter-cleaning` in `003`; the em-dash text from `002` is still live.)

**Current:**

> Leaves, moss and debris out, keeping your home safe from damp and overflow damage. We clear all gutters and downpipes and check the flow before we leave. [PLACEHOLDER: confirm equipment — e.g. camera-guided vacuum system]

**New:**

> Leaves, moss and debris out, keeping your home safe from damp and overflow damage. We clear all gutters and downpipes and check the flow before we leave. [PLACEHOLDER: confirm equipment, e.g. camera-guided vacuum system]

---

## 3. `services` — `slug` = `solar-panel-cleaning`, column `long_description`

**Current:**

> Dirty solar panels can lose a meaningful share of their output. We clean them safely with the right equipment and no harsh chemicals. [PLACEHOLDER: confirm price basis — per panel or per system]

**New:**

> Dirty solar panels can lose a meaningful share of their output. We clean them safely with the right equipment and no harsh chemicals. [PLACEHOLDER: confirm price basis, per panel or per system]

---

## 4. `faqs` — `question` = `How do I pay?`, column `answer`

**Current:**

> [PLACEHOLDER: confirm payment methods — e.g. bank transfer, card, GoCardless direct debit]

**New:**

> [PLACEHOLDER: confirm payment methods, e.g. bank transfer, card, GoCardless direct debit]

---

## Inactive row (fix only if reactivated)

## 5. `services` — `slug` = `pressure-washing`, column `long_description`

`003` set this service to `is_active = false` (superseded by the split into
`driveway-cleaning` + `patio-cleaning`), so it is **not shown to customers
today**. Fix it only if the service is ever switched back on.

**Current:**

> [PLACEHOLDER: confirm this service is offered — listed as "& more" on Instagram]

**New:**

> [PLACEHOLDER: confirm this service is offered, listed as "& more" on Instagram]

---

**Checked and left alone:** the other live `[PLACEHOLDER]` markers carry **no** em
dash and so are untouched here (conservatory-cleaning `long_description`; the
"Do I need to be home when you clean?" and "What happens if it rains?" FAQ
answers). The "Do you clean commercial properties?" and "Which areas do you
cover?" FAQ answers were already rewritten to clean text in `003` (the two rows
fixed live), so they carry no em dash either. No AI-typical phrasing was found
in the live catalogue or FAQ content.
