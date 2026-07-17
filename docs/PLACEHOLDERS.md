# Gleaming Ant — Placeholders & Client TODOs

Master checklist of everything shipped with a visible `[PLACEHOLDER]` marker, plus
the assets/decisions we need from the client before launch. Every row is
something a real value must replace — nothing here is invented as fact.

Most content placeholders live in the database (`site_settings`, `services`,
`faqs`) so the client can fill them in via the Phase 3 admin without a code
change. Others are page copy or assets.

## Contact details

| Item | Where it appears | What we need |
|---|---|---|
| Phone number | Footer, Contact page, `index.html` JSON-LD `telephone` | Public phone number → set `site_settings.contact.phone` (and the JSON-LD value) |
| Email address | Footer, Contact page | Public email → set `site_settings.contact.email` |
| WhatsApp | Footer, Contact page | WhatsApp number (or confirm none) → set `site_settings.contact.whatsapp` |

## Pricing

| Item | Where it appears | What we need |
|---|---|---|
| Real prices sign-off | Pricing matrix, every Service detail, booking quotes (Phase 2) | Confirm/adjust the seeded prices in `service_prices` and each `services.base_price`. Note shown on Pricing: "indicative and awaiting final sign-off" |
| Per-service price basis | Service detail `price_note` | Solar (per panel vs system), conservatory (roof included?), etc. — confirm basis |
| Payment methods | Home "How it works" step 3, FAQ "How do I pay?", Terms §5 | Which methods (bank transfer, card, direct debit…) and when payment is due |

## Services

| Item | Where it appears | What we need |
|---|---|---|
| Window cleaning method | Service detail (window) long description | Confirm method (e.g. pure-water reach & wash) |
| Gutter equipment | Service detail (gutter) long description | Confirm equipment (e.g. camera-guided vacuum) |
| Conservatory roof | Service detail (conservatory) long description | Confirm whether roof cleaning is included or priced separately |
| Solar price basis | Service detail (solar) long description | Per panel or per system |
| Pressure washing offered? | Currently hidden (`is_active = false`) | Confirm whether driveway/patio pressure washing is offered; if so, activate + price |
| Commercial cleaning | FAQ "Do you clean commercial properties?" | Confirm commercial offering (shops, offices, schools) |

## Policies & hours

| Item | Where it appears | What we need |
|---|---|---|
| Opening hours | Footer (Hours), booking availability (Phase 2) | Confirm real opening hours in `business_hours` (currently seeded, unconfirmed) |
| Rain / weather policy | FAQ "What happens if it rains?", Terms §6 | Confirm any rain guarantee / re-visit policy |
| Access & payment when out | FAQ "Do I need to be home?", Terms §4 | Confirm access arrangements and how payment is taken when the customer is out |

## Copy & assets

| Item | Where it appears | What we need |
|---|---|---|
| About-page story | About → "Our story" (two marked paragraphs) | Founder's story in their own words + what makes Gleaming Ant different (no invented claims) |
| Real job photos | Home "See the difference" section | Before/after photos (they have some on Instagram) to feature on the site |
| Official logo files | Everywhere (`Logo`, `AntMascot`, favicon are clean SVG recreations) | Official vector logo files if available, to replace the recreation |

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
| Supabase Auth redirect allowlist | Magic-link sign-in (`emailRedirectTo` → `${origin}/admin`) | In Supabase → Auth → URL Configuration, set **Site URL** and add **Redirect URLs** for `https://gleaming-ant.netlify.app/admin` and the production domain `https://gleamingant.co.uk/admin` (and `http://localhost:5173/admin` for local dev). Without these, magic links won't return to the dashboard. |
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
| `ANTHROPIC_API_KEY` | Netlify env (set in the UI, never committed) | Optional. When set, `/api/chat` answers with Claude; when absent it uses the deterministic rules fallback. Set it in Netlify → Site settings → Environment variables to enable AI replies. |
| `CHAT_MODEL` | Netlify env (optional) | Defaults to `claude-opus-4-8`. The owner can set a cheaper model (e.g. `claude-haiku-4-5`) to cut per-message cost — see docs/reports/phase-4.md for the cost note. |
| Assistant answer quality | `/api/chat` system prompt (built from live DB data) | The bot only knows what's in Supabase. As the client confirms real prices, payment methods, hours and contact details (the rows above), Sparkle's answers improve automatically — no code change needed. |
