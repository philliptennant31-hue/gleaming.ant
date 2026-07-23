# Content edits — answer-first policy (FAQ rows)

**Owner action required. No code change and no migration; these are live content edits.**

The answer-first policy (applied to the chat and the rules brain on 2026-07-23)
says the site should **answer every answerable question inline** — including
in-chat postcode checks and instant prices — and only redirect a visitor to
complete a booking. Two live FAQ rows still tell people to go to the booking
tool to *get* an answer. Update their answer text as below so the published FAQ
matches the policy. Sparkle (the site chat) is the first route for instant
answers; the online booking tool stays as a secondary path for a full quote.

These rows were seeded/updated by migrations `001` → `002` → `003`, which are
already applied to the live database. **Do not add a new migration** — edit the
content in place.

## How to apply

GA has no FAQ editor in the admin panel today, so apply these in **Supabase →
Table editor → `faqs`** (or the SQL editor). For each row below, find it by its
exact **question** and replace only the **answer** with the new text. Leave
`question`, `category`, `sort_order` and `is_active` unchanged. Nothing else
needs to change.

---

## 1. "How do I get a quote?"  (category: `pricing`)

**Current answer:**

> Use our online booking tool for an instant quote based on your property and the services you need, or send us a message. Quotes are always free.

**New answer:**

> Ask Sparkle in the chat for an instant answer, or use our online booking tool. Both work out your quote from your property and the services you need. Quotes are always free.

*Why:* leads with the in-chat answer (Sparkle) and keeps the booking tool as a
secondary path, rather than framing the tool as the only way to get a price.

---

## 2. "Which areas do you cover?"  (category: `general`)

**Current answer:**

> We're based in Basildon and cover Essex county-wide, including Billericay, Wickford, Brentwood, Shenfield, Chelmsford, Rayleigh, South Woodham Ferrers and many more towns and villages. Not sure about your postcode? Enter it in the booking tool or drop us a message and we'll confirm.

**New answer:**

> We're based in Basildon and cover Essex county-wide, including Billericay, Wickford, Brentwood, Shenfield, Chelmsford, Rayleigh, South Woodham Ferrers and many more towns and villages. Not sure about your postcode? Ask Sparkle in the chat for an instant answer, or drop us a message and we'll confirm.

*Why:* the coverage answer is kept in full; only the postcode check is
re-routed from "enter it in the booking tool" (a redirect to *get* an answer) to
an in-chat check with Sparkle, which the chat now handles directly.

---

**No other live FAQ rows carry the offence** (grep-confirmed 2026-07-23: only the
two rows above referenced the booking tool as the way to get an answer).
