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
