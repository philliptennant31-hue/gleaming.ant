# Gleaming Ant: the booking system your new website is missing

## 1. What this is

Antony has a website now, and it's a good one: professional, SEO-savvy, his brand
everywhere. Do not pitch against it. Pitch the layer it doesn't have.

Every "GET A FREE QUOTE" button on gleamingant.co.uk opens a contact form. Then
Antony does admin: reply, quote, arrange, remember. This build is what those
buttons should open instead — instant priced quotes, self-serve booking, a back
office, and an AI assistant — already in his brand, with his real services, his
real towns, his real photos and his own story in it. His website stays exactly
where it is, run by whoever runs it. We add the missing half.

Live now at gleaming-ant.netlify.app. The day he says yes, it becomes
book.gleamingant.co.uk (one DNS record) and his site's quote buttons point at it
(one link change for his web person). Nothing else on his site changes.

## 2. What his site does today, and what this adds on top

This is the heart of the pitch. Not "your site is missing things" — "look what
your site can *do* now."

| His website today | With this plugged in |
|---|---|
| "Get a free quote" → contact form → wait for a reply | Instant price on screen in under a minute, 24/7 |
| Quote handled by message, from memory | Quote priced from his real rate card, every time, bundles included |
| Booking arranged back-and-forth | Customer picks a real slot from his live diary and books it |
| Enquiries land in an inbox | Bookings land in a dashboard: confirm, complete, note, message — one tap |
| Prices, areas, hours live in his head | All editable by him in the admin, no web person needed |
| Questions answered when he's off the tools | Sparkle answers from his real catalogue any hour, then hands the customer into a part-filled quote |
| "Friendly reminders before every visit" (his promise) | Reminder and confirmation messages drafted for him, ready to send |
| Photos sit on the website | His real before/afters, interactive slider, doing sales work |
| Contact form with no privacy policy | Proper privacy page and data locked down at the database |

The last row is a favour, not an attack — see section 8.

## 3. Guided demo

The demo is the pitch. It now speaks his exact business — same 8 services as his
menu, his 15 towns, his founder story, his van, his real before/afters. The
moment to engineer is him realising: *"it already knows my business."*

Hand him your phone. One thing to open, one thing to say.

1. **Home**
   - Show: his brand, the ant, his real before/after slider.
   - Say: "This isn't a mock-up — these are your jobs, your services, your towns."
2. **A live quote, his own house**
   - Show: Get an instant quote → pick Window + Gutter → his bedroom count → his postcode (any CM or SS — Billericay, Basildon, Wickford all know they're his patch) → watch the price build, bundle discount included.
   - Say: "That's what your quote button could do. Ninety seconds, priced, no admin."
3. **Book it**
   - Show: pick a real slot, book it, reference on screen.
   - Say: "Your diary only offers times you actually work. You control the hours."
4. **Sparkle**
   - Show: ask it "do you do roof cleaning in Wickford?" then tap through into the part-filled quote.
   - Say: "It only answers from your real prices and areas. It never makes things up."
5. **The booking lands with him**
   - Show: the admin on your phone — the booking sitting there as pending.
   - Say: "This is your side. Confirm it and the customer message is drafted for you — that's your 'friendly reminder before every visit' promise, automated."
6. **He runs it himself**
   - Show: change a price, flip a service on or off, edit hours.
   - Say: "No developer, no waiting. Yours to run."
7. **How it plugs in**
   - Show: his own site's GET A FREE QUOTE button.
   - Say: "Your website doesn't change. Your web person points this button at book.gleamingant.co.uk — one line — and you're live."

## 4. What I still need from Antony

Much shorter than it used to be — his own website answered most of it (services,
towns, contact details, his story, commercial work, the reminder promise, real
photos). What's left:

- **Prices, his sign-off.** Every figure in there is a placeholder to react to. Especially the five services new to the build: driveway, roof, patio, render, brickwork — roof/render/brick are marked "confirmed after a quick survey," check he's happy with that framing.
- **Opening hours.** Seeded Mon–Fri 8–5, Sat 9–2. Confirm.
- **Policies.** Rain policy, access/payment when the customer is out, how he takes payment.
- **Blessing on what I borrowed.** His founder story, the van photo and the before/afters came from his own site — confirm he's happy, and get originals if he has better.
- **Postcode edges.** I've mapped his 15 towns to postcodes; he'll know the streets I've got wrong.
- **WhatsApp.** Confirm 07497 386385 is the right number for booking handoff messages.

## 5. Running costs, honest numbers

Real prices, checked 17 July 2026. Snapshots, not promises.

**As it stands today**

| What | Cost | Notes |
|---|---|---|
| Hosting | £0 | Netlify free tier — far more than a local trade site uses. |
| Database and sign-in | £0 | Supabase free tier, plenty for his bookings. Nightly backup job keeps it warm and copied. |
| Sparkle | ~1.2p a message | Claude Sonnet 5; about £3.70/month at 300 messages. Rules-only fallback is free. |
| Subdomain | £0 | book.gleamingant.co.uk is a record on the domain he already owns. |

**Everything switched on** (auto emails via Resend £0, texts via Twilio ~£4–5/month): roughly **£8–10 a month total**. Full breakdown, ownership of accounts, and the Supabase Pro upgrade trigger are unchanged from before: seven accounts, all created in Gleaming Ant's name at handover, the business owns every piece.

**Alongside his current site.** This build costs him nothing extra on his website side: his site stays on its hosting, his arrangement with his web person stays whatever it is. This is an addition, not a migration. (If he ever wants the whole site in one place, that door exists — it's a DNS decision, not a rebuild. Don't pitch it; let him arrive there.)

## 6. The day he says yes

- His web person adds one CNAME: `book` → gleaming-ant.netlify.app. Two minutes' work, breaks nothing.
- Same person points the site's quote buttons at book.gleamingant.co.uk.
- Antony's email goes on the admin; he signs in with a magic link.
- His real prices go in (I load them with him on a call, or he does it from the dashboard).
- Live the same day.

## 7. Cost to him

**Start with a free month, his real prices loaded.** Once his customers have
booked themselves in for four weeks, going back to the form will feel like
going back to a paper diary. That's the sale doing itself.

Recommended structure for an add-on service (my view):

- **£0 setup** — "it's already built; I built it because I rate what you're doing."
- **£[FOR PHILLIP: 49?] a month**, everything running: hosting, Sparkle, backups, small changes and support included. Anchor it to jobs, not software: one extra driveway job a month is £110+; one regular window customer is worth £200+ a year. It costs less than half of one small job.
- **Cancel anytime, data exported, no hard feelings.** The form on his site keeps working regardless — there's genuinely no lock-in, which is exactly why he can say yes quickly.

Alternative if he'd rather own it outright (the original two-package structure):
**£500 handover** (everything in his name, an hour's walkthrough) or **£750
launch** (I do the lot with him and stay on call for the first month), then
~£10/month running costs in his own name, optional £15/month for me to keep an
eye on it. Offer this only if he bristles at subscriptions — sole traders often
prefer owning to renting, and both roads are fine for us.

[FOR PHILLIP: pick the recommended number and whether the outright option stays
on the table before the meeting — don't decide prices live in the room.]

## 8. The favours file

Things spotted on his site that his web person should fix. Never open with
these — they read as rubbishing his purchase. Drop them in late, generously,
as free value ("by the way…"). Each one quietly shows you notice things.

- **No privacy policy anywhere** — his contact form collects names, postcodes, phones and emails; UK GDPR requires a privacy notice. Ours ships with one. Offer him a template for his site either way.
- **The testimonials** are first-name-only and read agency-written; if they're not real customers, they should come down (fake reviews are now explicitly illegal in the UK — DMCC Act). The better play: collect real Google reviews, and this build can show them later.
- **The per-service photo sets** on his site (driveway, roof, render…) look stock or AI-generated. His REAL photos — the van, the before/afters — are far more convincing, which is why this build uses only those.
- A leftover "Hello world" blog post from the WordPress install is still live.

## 9. Later, if he wants it

- Automated text confirmations and day-before reminders (~4p a text).
- Real Google reviews on the site, and a Google Business profile tie-in.
- A before/after gallery fed from his Instagram.
- Seasonal offers through the built-in discounts.
- Programmatic town-by-service pages (the SEO play his agency did by hand, generated from his live data) — only relevant if the site ever consolidates here.
