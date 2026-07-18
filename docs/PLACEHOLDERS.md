# Gleaming Ant — Placeholders & Client TODOs

Master checklist of everything shipped with a visible `[PLACEHOLDER]` marker, plus
the assets/decisions we need from the client before launch. Every row is
something a real value must replace — nothing here is invented as fact.

Most content placeholders live in the database (`site_settings`, `services`,
`faqs`) so the client can fill them in via the Phase 3 admin without a code
change. Others are page copy or assets.

## Contact details

**RESOLVED (2026-07-18, source: client's live site gleamingant.co.uk)** — mirrored in
`003_mirror_live_client_site.sql` (`site_settings.contact`) and `index.html` JSON-LD.

| Item | Where it appears | Status |
|---|---|---|
| Phone number | Footer, Contact page, `index.html` JSON-LD `telephone` | **DONE** → `07497 386385` (JSON-LD `+44 7497 386385`) |
| Email address | Footer, Contact page, `index.html` JSON-LD `email` | **DONE** → `hello@gleamingant.co.uk` |
| WhatsApp | Footer, Contact page | **DONE** → `447497386385` (link `https://wa.me/447497386385`) |

## Pricing

| Item | Where it appears | What we need |
|---|---|---|
| Real prices sign-off | Pricing matrix, every Service detail, booking quotes (Phase 2) | Confirm/adjust the seeded prices in `service_prices` and each `services.base_price`. Note shown on Pricing: "indicative and awaiting final sign-off" |
| **New-service guide prices** | Driveway, Roof, Patio, Render, Brickwork detail + pricing matrix | **Antony's real numbers.** Their live site lists these services but no prices, so `003_mirror_live_client_site.sql` seeds our own guide prices (driveway £90–150, roof £395–650, patio £70–120, render/brickwork £150–260). Each carries a "guide price, confirmed…" note; roof/render/brickwork are survey-priced in reality. |
| Per-service price basis | Service detail `price_note` | Solar (per panel vs system), conservatory (roof included?), etc. — confirm basis |
| Payment methods | Home "How it works" step 3, FAQ "How do I pay?", Terms §5 | Which methods (bank transfer, card, direct debit…) and when payment is due |

## Services

| Item | Where it appears | What we need |
|---|---|---|
| Window cleaning method | Service detail (window) long description | Confirm method (e.g. pure-water reach & wash) |
| Gutter equipment | Service detail (gutter) long description | Confirm equipment (e.g. camera-guided vacuum) |
| Conservatory roof | Service detail (conservatory) long description | Confirm whether roof cleaning is included or priced separately |
| Solar price basis | Service detail (solar) long description | Per panel or per system |
| ~~Pressure washing offered?~~ | — | **RESOLVED (2026-07-18)** → their menu splits this into **Driveway Cleaning** and **Patio Cleaning** (both now active); the old combined `pressure-washing` row is retired (`is_active = false`). |
| Service catalogue | Services list, nav, pricing | **RESOLVED (2026-07-18, source: gleamingant.co.uk)** → mirrored their full menu: window, driveway, roof, gutter, patio, solar, render, brickwork (+ fascia/soffit and conservatory, confirmed in their homepage prose). Prices still pending (row above). |
| ~~Commercial cleaning~~ | FAQ "Do you clean commercial properties?" | **RESOLVED (2026-07-18)** → confirmed yes: homes, offices, shops, schools and a wide range of commercial buildings. |

## Coverage areas

**RESOLVED (2026-07-18, source: gleamingant.co.uk locations page)** — `003_mirror_live_client_site.sql`
replaces the old South-Essex list + £7.50 surcharge with their real Essex-wide coverage: 15 named
towns (Billericay, Basildon, Wickford, Brentwood, Shenfield, Hutton, Ingatestone, Stock, Ramsden
Heath, Mountnessing, Chelmsford, Danbury, Great Baddow, Rayleigh, South Woodham Ferrers) plus an
"Essex & surrounding areas" catch-all, **all £0.00 surcharge** (their site has no travel
surcharge). Base is Basildon.

| Item | Where it appears | What we need |
|---|---|---|
| Postcode-prefix boundaries | `service_areas.postcode_prefixes`, booking area-match, chat | **Inferred from UK postcode geography — needs Antony's confirmation.** Their site names towns but not outcodes. Some outcodes intentionally sit in more than one town (e.g. CM15 covers Brentwood/Shenfield/Mountnessing; CM4 covers Ingatestone/Stock; CM1x may read as Billericay). Because every area is £0.00 surcharge, this only affects the *area name* shown, never coverage or price. Confirm the per-town outcodes if precise labelling matters. |

## Policies & hours

| Item | Where it appears | What we need |
|---|---|---|
| Opening hours | Footer (Hours), booking availability (Phase 2) | Confirm real opening hours in `business_hours` (currently seeded, unconfirmed) |
| Rain / weather policy | FAQ "What happens if it rains?", Terms §6 | Confirm any rain guarantee / re-visit policy |
| Access & payment when out | FAQ "Do I need to be home?", Terms §4 | Confirm access arrangements and how payment is taken when the customer is out |

## Copy & assets

| Item | Where it appears | What we need |
|---|---|---|
| About-page story | About → "Our story" | **DRAFTED (2026-07-18, source: gleamingant.co.uk)** → real copy written from their founder facts (Antony, local Essex window cleaner; reputation via reliability, attention to detail and high standards; homes + commercial across Essex from Basildon). The `[PLACEHOLDER]` markers are gone. **Pending: Antony's sign-off on tone/wording** in his own words. |
| Real job photos | Home "See the difference" section | Before/after photos (they have some on Instagram) to feature on the site |
| Official logo files | Everywhere (`Logo`/`BrandBadge`, `AntMascot`, favicon) | Site artwork was rebuilt as SVG to faithfully match the supplied logo (tilted four-pane window, squeegee, ant, sparkles, GLEAMING ANT / WINDOW & EXTERIOR CLEANING banners). A high-res raster export (PNG/transparent) from the client's original file is still welcome for social/OG images and print. |

## Legal

| Item | Where it appears | What we need |
|---|---|---|
| Privacy policy review | `/privacy` (scaffold, clearly marked) | Solicitor to complete & approve; fill registered name/address, processors, retention, lawful bases, cookies, "last updated" date |
| Terms of service review | `/terms` (scaffold, clearly marked) | Solicitor to complete & approve; quotes validity, cancellation, insurance scope, complaints, jurisdiction, "last updated" date |

## Infrastructure

| Item | Where it appears | What we need |
|---|---|---|
| Custom domain | `site_settings.business.domain` = `gleamingant.co.uk`; site currently on `gleaming-ant.netlify.app` | Point `gleamingant.co.uk` DNS at Netlify and set the domain (update canonical/OG URLs when live) |

## Admin & authentication (Phase 3)

The management dashboard at `/admin` is built and wired to live Supabase CRUD. It
lets the client fill in most of the placeholders above (contact details, prices,
hours, services, FAQs via settings/services tables) without a code change. A few
infrastructure/config items still need action before it works end-to-end in
production:

| Item | Where it appears | What we need |
|---|---|---|
| Supabase Auth redirect allowlist | Magic-link sign-in (`emailRedirectTo` → `${origin}/admin`) | **DONE for now** (2026-07-17): Site URL = `https://gleaming-ant.netlify.app`, redirect URLs cover the Netlify URL and `http://localhost:5173`. Remaining: add `https://gleamingant.co.uk/**` when the custom domain goes live. |
| Magic-link email branding/delivery | The email the admin receives to sign in | Confirm Supabase Auth email sender/SMTP and (optionally) brand the "Magic Link" email template. The default Supabase sender works for low volume but is unbranded. |
| Admin allowlist members | `admin_emails` table, managed in **Settings → Who can sign in** | Only `phillip.tennant31@gmail.com` is seeded. Add/remove real team emails via the dashboard (a signed-in admin can't remove their own access). |
| Booking source note | Bookings appear in the dashboard once Phase 2 (booking wizard) writes them | Until Phase 2 ships, the Bookings/Dashboard views will be empty except for any rows inserted directly. Not a defect — flagged so the empty state isn't mistaken for a bug. |

## Booking (Phase 2)

| Item | Where it appears | What we need |
|---|---|---|
| Booking confirmation channel | Booking confirmation page ("we'll confirm your day and time by message — [PLACEHOLDER]") | How the team confirms a booking (text / WhatsApp / email) so the copy can name it — currently kept vague as "by message" |
| Payment timing on a booking | Booking confirmation page ("there's nothing to pay now — [PLACEHOLDER]") | Confirm how and when payment is taken for a booked clean (complements the existing "Payment methods" row) |

## Chatbot — "Sparkle" (Phase 4)

The assistant has **no visible `[PLACEHOLDER]` markers** — it degrades gracefully (falls back to the built-in rules brain, and never invents prices/policies). These are configuration/infrastructure TODOs only.

| Item | Where it appears | What we need |
|---|---|---|
| `ANTHROPIC_API_KEY` | Netlify env (set in the UI, never committed) | **Already active** (2026-07-17): the Netlify team has a shared `ANTHROPIC_API_KEY`, which this project inherits — live replies verified as `source: "ai"`. Decide whether the team key should keep billing for this client's bot, or set a project-scoped key to override it. Remove/override it to fall back to the free rules brain. |
| `CHAT_MODEL` | Netlify env (optional) | **Set to `claude-sonnet-5`** (2026-07-17) after a cost/quality review: near-identical service at about a third of Opus cost, roughly 1.2p a message. The code default remains `claude-opus-4-8` if the variable is removed; `claude-haiku-4-5` is the budget option (~0.4p). |
| Assistant answer quality | `/api/chat` system prompt (built from live DB data) | The bot only knows what's in Supabase. As the client confirms real prices, payment methods, hours and contact details (the rows above), Sparkle's answers improve automatically — no code change needed. |

## Backups

| Item | Where it appears | What we need |
|---|---|---|
| Nightly backup secrets | `.github/workflows/db-backup.yml` (runs nightly, currently skips with a clear error until configured) | Phillip, ~2 minutes, credentials stay with you: Supabase dashboard → Project settings → Database → copy the session-pooler URI (reset the DB password if unknown), then `gh secret set SUPABASE_DB_URL` and `gh secret set BACKUP_PASSPHRASE` (long random phrase, keep it in a password manager). First green run = backups live, £0. |

## Notifications (Phase 6)

Confirming a booking in the admin now offers to notify the customer. It is
deliberately tiered so nothing depends on services that are not configured yet:

- **Works today, zero setup (manual):** confirmed bookings show a "Notify the
  customer" group in the booking drawer. "Email confirmation" opens the owner's
  own mail app with the subject and full message prefilled from real booking
  data; "Text confirmation" (shown when the booking has a phone number) does the
  same in the messages app. The owner reads it over and presses send.
- **Automatic email (one env var away):** after Confirm, the admin calls
  `/api/notify-booking`, which sends a branded confirmation email through
  Resend when `RESEND_API_KEY` exists. Until then the endpoint reports "not
  configured" and the admin sees a toast pointing at the manual buttons. The
  manual buttons stay visible either way, and a "Resend confirmation email"
  action re-triggers the automatic email on already-confirmed bookings.
- **SMS:** manual only (the sms: button). Automated texting is intentionally
  not built; see the row below for the future option.

| Item | Where it appears | What we need |
|---|---|---|
| `RESEND_API_KEY` | Netlify env (set in the UI, never committed) | Create a free Resend account (resend.com), create an API key, and add it in Netlify as `RESEND_API_KEY`. From that moment confirmation emails send automatically; no deploy or code change needed. |
| Sender address (`NOTIFY_FROM`) | The From line of the automatic confirmation email | Until a domain is verified, sending uses `Gleaming Ant <onboarding@resend.dev>`. Note the resend.dev test sender only delivers to the Resend account owner's own address, so real customers will not receive it. Verify `gleamingant.co.uk` in Resend (DNS records), then set `NOTIFY_FROM` in Netlify, for example `Gleaming Ant <hello@gleamingant.co.uk>`. |
| Automated SMS (future option) | Not built anywhere; the manual "Text confirmation" button covers texting today | If automated texts are wanted later: a Twilio (or similar) account with a UK number, its credentials in Netlify env, and a small extension of `/api/notify-booking` to send via its API. Decide whether the cost per text is worth it before building. |
