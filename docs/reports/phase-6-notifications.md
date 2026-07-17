# Phase 6 report: booking confirmation notifications

Status: **complete**. When the owner confirms a booking in the admin, the
customer can now be notified. Everything works in tiers so nothing depends on
an unconfigured provider.

```
npx tsc --noEmit  -> exit 0 (clean)
npx vitest run    -> 4 files, 81 tests, all pass (includes 9 new notify tests)
```

`vite build` intentionally not run (orchestrator builds after integration). No
new dependencies. No git commands. No shared files edited.

## What was built

### Tier 1: manual notify buttons (works today, zero configuration)

In the booking detail drawer (`src/pages/admin/BookingsPage.tsx`), every
**confirmed** booking shows a "Notify the customer" panel at the top of the
drawer body:

- **Email confirmation**: a `mailto:` link to the customer with the subject
  `Your Gleaming Ant booking is confirmed (<reference>)` and a body containing
  the reference, date, time, services list, total and a friendly sign-off, all
  built from real booking data with the existing `src/lib/format.ts` helpers.
  No placeholder markers anywhere.
- **Text confirmation**: shown only when the booking has a phone number. An
  `sms:<phone>?body=<encoded>` link with a short message carrying the
  reference, date and time.
- **Resend confirmation email**: re-triggers the automatic email (tier 2) on
  already-confirmed bookings, with a spinner while in flight.

Link builders live in `src/components/admin/notify.ts` alongside a
`requestConfirmationEmail()` helper that never throws and returns a typed
outcome (`sent` / `not_configured` / `failed`).

### Tier 2: automatic email (activates the moment `RESEND_API_KEY` exists)

- **`netlify/functions/notify-booking.ts`**: Functions v2 handler
  (`export default async (req: Request)`), reachable as `/api/notify-booking`
  via the existing redirect. Contract below.
- **`netlify/functions/lib/notify.ts`**: self-contained library (no imports
  from `src/` or the chat-owned function libs): UUID validation, GB formatters
  mirroring `src/lib/format.ts`, the branded email builder (subject + HTML +
  plain text) and the Resend sender (10s timeout, typed error handling).
- **`netlify/functions/lib/notify.test.ts`**: 9 vitest cases covering the
  subject line, text and HTML details, adjustment-row logic, HTML escaping of
  customer-supplied values, missing-name/empty-items fallbacks, and a
  no-em-dash guard.

The email is inline-styles-only for email-client compatibility: paper
background, white card, teal-deep header band with "Gleaming Ant", the
reference in an amber pill, a booking details table (date, time, address), a
services table with per-line prices (subtotal, bundle discount and surcharge
rows appear only when nonzero) and a bold total, a what-happens-next line, and
a note to reply if anything needs changing. A matching plain-text part is
always included. Customer-supplied strings are HTML-escaped.

### Tier 3: SMS (documented, not built)

No fake integration. The manual `sms:` button covers texting today; the Twilio
option is written up in `docs/PLACEHOLDERS.md` under "Notifications (Phase 6)".

## `/api/notify-booking` contract

Request:

```
POST /api/notify-booking
Authorization: Bearer <the admin's Supabase access token>
Content-Type: application/json

{ "booking_id": "<uuid>" }
```

Responses (the three `sent: false` reasons are deliberate 200s: configuration
or provider problems must never look like a server error to the admin UI):

| Status | Body | Meaning |
|---|---|---|
| 200 | `{ "sent": true, "email": "<to>" }` | Resend accepted the email |
| 200 | `{ "sent": false, "reason": "not_configured" }` | No `RESEND_API_KEY` in the environment |
| 200 | `{ "sent": false, "reason": "send_failed" }` | Resend errored or timed out (10s) |
| 200 | `{ "sent": false, "reason": "no_email" }` | Booking row has no email address (belt and braces) |
| 400 | `{ "error": ... }` | Invalid JSON, or `booking_id` missing / not a UUID |
| 401 | `{ "error": ... }` | No bearer token, or Supabase rejected the token |
| 403 | `{ "error": ... }` | RLS returned no row: caller is not an admin, or no such booking |
| 405 | `{ "error": ... }` | Non-POST (with `Allow: POST`) |
| 502 | `{ "error": ... }` | Supabase REST unreachable or unexpected status |

## Security model (deliberate, per the brief)

The function holds **no service-role key** and performs **no authorisation
logic of its own**. It validates `booking_id` as a UUID, then fetches
`GET {SUPABASE_URL}/rest/v1/bookings?id=eq.<id>&select=*` with the public anon
`apikey` plus the caller's **forwarded** `Authorization` bearer. Row-level
security answers the authorisation question: an admin token returns the row;
any other token returns an empty array, which the function maps to 403. URL and
key use the same env-with-public-fallback pattern as `lib/data.ts`.

## Admin integration

After a successful Confirm, the status update commits first, then
`/api/notify-booking` is called fire-and-forget. Toasts:

- sent: `Confirmation email sent to <email>` (success tone)
- not_configured: `Automatic email is not set up yet, use the buttons below to
  send it yourself` (info tone)
- anything else: `Automatic email failed, use the buttons below` (error tone)

A notify failure never blocks or rolls back the status change, and the manual
buttons remain visible regardless of the outcome.

## Decisions

1. **`lib/notify.ts` is fully self-contained** (local booking subset type, own
   formatters). The chat agent concurrently owns `lib/types.ts` and
   `lib/data.ts`, so importing from them would race their edits; the constants
   they would share are public by design and tiny.
2. **Date formatting is UTC-pinned on the server** so the rendered day never
   shifts with the Netlify region's timezone; output matches the client
   formatter ("Fri 24 July 2026").
3. **`no_email` is its own reason** rather than a fake `send_failed`, kept
   honest in the contract; the admin UI maps any unknown reason to the failed
   toast, so no UI change is needed if reasons grow.
4. **Discount display**: the email prints `-£9` (sign outside the currency)
   rather than the drawer's `£-9`; clearer in customer-facing copy.
5. **No em dashes** in any customer-facing copy, template, toast or the new
   docs sections, per the pending copy pass.

## Needs review / follow-ups

1. **Resend test-sender limitation**: until `gleamingant.co.uk` is verified in
   Resend and `NOTIFY_FROM` is set, the default `onboarding@resend.dev` sender
   only delivers to the Resend account owner's own inbox. Documented in
   PLACEHOLDERS; worth telling the owner explicitly when the key is added.
2. **Typecheck scope note**: root `tsc --noEmit` covers `src/` only (its
   `include` is `["src", "vite.config.ts"]`). An ad hoc strict check of the new
   function files shows zero errors beyond the pre-existing, project-wide
   ambient `process` gap (no `@types/node` installed; `chat.ts` and
   `lib/data.ts` have the same), which I could not fix without adding a
   dependency. If a later phase adds `@types/node` as a dev dependency, the
   functions could be brought under a real tsconfig.
3. **Not eyeballed in a browser**: the drawer panel reuses existing primitives
   and typechecks, but a visual pass (and a real Confirm round-trip once a
   Resend key exists) is worth doing during integration. Locally under plain
   Vite dev (no `netlify dev`), `/api/notify-booking` 404s and the UI shows the
   graceful failed toast; that is expected, production routes via netlify.toml.
4. **`sms:` URI behaviour varies by platform** (iOS historically preferred
   `&body=`); the standard `?body=` form is used per the brief and works on
   current iOS and Android. The button only renders when a phone number exists.
