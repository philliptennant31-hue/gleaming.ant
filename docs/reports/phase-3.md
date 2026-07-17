# Phase 3 report — Owner management dashboard (`/admin`)

Status: **complete**. Typecheck passes; login + guard verified live in-browser.

```
npx tsc --noEmit  → exit 0
```

`npm run build` / `vite build` intentionally NOT run — the orchestrator builds
after integration (concurrent agents share `dist/`). No new dependencies added.

## What was built

A full, live-Supabase management dashboard mounted at `/admin/*`, outside the
public `Layout`, with its own chrome. Passwordless (magic-link) auth, a two-level
guard, and seven CRUD subpages.

### Auth & guard
- **`AdminLoginPage.tsx`** — magic-link / email-OTP sign-in via
  `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: \`${origin}/admin\` } })`.
  "Check your inbox" state with a **resend + 40s cooldown**, a distinct busy flag
  (so resending never flips the view back to the form), field + send error
  handling, and copy that sets the expectation up front: anyone can request a
  link, but only allow-listed emails get in. Reads router `state.notAuthorised`
  to show the "that email isn't authorised" banner after a guard bounce.
  Redirects to `/admin` if a session already exists.
- **`AdminApp.tsx`** — the `/admin/*` shell. Subscribes to
  `supabase.auth.onAuthStateChange` (which emits `INITIAL_SESSION` after the
  client has read storage **and** processed the magic-link hash, so it covers
  both the stored-session and redirect-from-email cases). Guard states:
  `checking` → spinner; no session → `<Navigate to="/admin/login">`; session but
  **`admin_emails` returns no row** (RLS filtered it out) → sign out + redirect
  with the not-authorised flag; a network/unexpected error → retryable error
  state (does **not** sign the user out); admin confirmed → render shell + nested
  `<Routes>`. The async allowlist check is deferred out of the auth callback with
  `setTimeout(…, 0)` to avoid the known supabase-js auth-lock deadlock.
- **`AdminShell.tsx`** — deep-teal (chalkboard) compact sidebar: Dashboard,
  Bookings, Services & Pricing, Areas, Availability, Messages, Settings, plus
  "View site" and "Sign out" and the signed-in email. Desktop = persistent 16rem
  rail; mobile = top bar with a hamburger → slide-in drawer (Esc to close, closes
  on nav). `NavLink` active states, brand tokens, utilitarian/table-first.

### Subpages (`src/pages/admin/`)
All use `useAsync` for loading/error, friendly empty states, **refetch-after-write**,
confirm dialogs for destructive actions, and toast feedback.
- **Dashboard** — three stat cards (pending, confirmed-upcoming, new messages) as
  count queries, a next-7-days list, and quick links.
- **Bookings** — table (date/time, mono reference, customer, area+postcode,
  services summary from `items`, total, status badge); filters (status;
  upcoming/past/all; text search over name/reference/postcode); a right-side
  **detail drawer** with full customer/address/items breakdown + price lines +
  customer notes; status transitions (confirm / complete / cancel-with-confirm)
  and an editable **admin notes** textarea (save disabled until changed).
- **Services & Pricing** — services table (icon, name, slug, from-price, sort,
  live active toggle, Edit); **`ServiceModal`** editing every field incl.
  long_description, duration, unit label, price note, icon, sort, supports_frequency
  and active, with auto kebab-case slug from name on create; **price-matrix editor**
  (services × bands, per-cell number inputs, upsert only changed cells via
  `onConflict: 'service_id,band_code'`); **frequencies editor** (label / multiplier /
  active); **bundle-discounts editor** (min_services / percent / active, add + remove).
- **Areas** — `service_areas` CRUD via a modal; postcode prefixes as a
  comma-separated field ↔ `text[]` (trimmed, upper-cased, de-duped), surcharge,
  is_core, live active toggle, sort_order; delete with confirm.
- **Availability** — 7-row business-hours editor (open toggle + time inputs,
  validated open<close, upsert on `day_of_week`, Monday-first display) and
  blocked-slots CRUD (add date/from/to/reason, upcoming list, delete with confirm).
- **Messages** — `contact_messages` inbox (newest first), status filter, detail
  drawer, status chips/transitions (new/read/replied/archived), auto-marks a
  message read on open, and a `mailto:` reply that also marks it replied.
- **Settings** — friendly forms writing each `site_settings` row by key (contact,
  social, booking rules as numbers, business info) via upsert while **preserving
  any unrendered keys**; plus an **admin-emails manager** (list/add/remove) that
  disables removing your own signed-in email (belt-and-braces guard in the
  handler too).

### Shared admin components (`src/components/admin/`)
- **`data.ts`** — the admin data layer (all reads include inactive rows since RLS
  grants admins full SELECT; typed writes/upserts/deletes; date/time/slug helpers).
  Kept separate from the shared `src/lib/api.ts`, which Phase 3 must not edit.
- **`primitives.tsx`** — `ToastProvider`/`useToast`, `Modal`, `SlideOver`,
  `ConfirmDialog`, `Switch`, `DangerButton`, booking/message status badges,
  `AdminHeading`, and a `TableCard` + `th`/`td` class helpers.
- **`ServiceModal.tsx`**, **`AdminShell.tsx`** as above.

## Verified live (Vite dev server on :5173)
- `/admin/login` renders correctly, no console errors.
- `/admin` with no session → redirects to `/admin/login` (confirmed
  `location.pathname === '/admin/login'`).
- The authenticated dashboard itself can't be driven without completing a real
  magic-link sign-in (needs inbox access), so those screens were reviewed by code
  + typecheck rather than eyeballed — worth a visual pass once auth redirect URLs
  are configured (see PLACEHOLDERS "Admin & authentication").

## Design decisions
- **Refetch-after-write over optimistic** everywhere for correctness; a shared
  toast gives immediate feedback so the reload latency reads as intentional. A
  known trade-off: unsaved edits in one editor are reset if another write on the
  same page triggers a reload. Acceptable for a low-concurrency admin tool.
- **No "delete service"** — services are hidden with the active toggle instead
  (matches how the public site filters `is_active`, and avoids a destructive
  cascade to `service_prices`). Areas, bundles and blocked slots do support
  delete (simple config rows), each behind a confirm dialog.
- **`DangerButton` + raw confirm button** — the shared `Button`'s variant colour
  utilities (e.g. `text-teal-deep`) would collide with an appended `text-danger`
  (Tailwind class-order is not source-order), so destructive actions use a
  dedicated primitive with a single, unconflicted class set rather than
  overriding `Button`.
- **Auth resilience** — the guard treats *no allowlist row* (deny → sign out) and
  *network error* (retry, stay signed in) differently, so a transient blip never
  locks an admin out; `maybeSingle()` makes the distinction clean.
- **Times/dates as strings** — DB `time` returns `HH:MM:SS`; normalised to `HH:MM`
  for `<input type="time">` and written back as `HH:MM`. Dates compared as ISO
  strings (lexicographic == chronological). Display uses `src/lib/format.ts`.

## Shared-file concerns (raised, not edited — per SPEC ownership rules)
Nothing **needs** changing — everything was achievable within admin ownership by
adding `src/components/admin/data.ts` rather than extending `src/lib/api.ts`. Two
optional, non-blocking notes for the reviewer/orchestrator:
1. **Supabase Auth config is required for magic links to work in prod** (redirect
   URL allowlist + Site URL). This is a dashboard/infra setting, not code — logged
   in `docs/PLACEHOLDERS.md` under "Admin & authentication".
2. If future phases want admin catalogue reads (incl. inactive rows) reused, the
   helpers now live in `src/components/admin/data.ts`; they could be promoted into
   `src/lib/` in a later consolidation, but that's a shared-file edit I left alone.

## Untouched (respected hard limits)
Did not modify `App.tsx`, `index.css`, `package.json`, any `src/lib/**` or
`src/components/ui/**` shared file, `booking/**`, `chat/**`, `netlify/**`,
`supabase/**`, or the SPEC/BRAND docs. No new dependencies, no dev server started
by me (used the already-running preview), no `vite build`, no git commands. Only
created/edited files under `src/pages/admin/**` and `src/components/admin/**`,
wrote this report, and appended to `docs/PLACEHOLDERS.md`.
