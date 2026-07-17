# Gleaming Ant — Window & Exterior Cleaning

Website, booking & management system, and AI assistant for
[Gleaming Ant](https://www.instagram.com/gleaming.ant/) (Essex, UK).

**Live:** https://gleaming-ant.netlify.app (custom domain gleamingant.co.uk to follow)

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS v4 (SPA, React Router 7)
- **Data & auth:** Supabase — Postgres with row-level security as the only security
  boundary (publishable key in the client; no service-role key anywhere), magic-link
  auth for the admin dashboard
- **Serverless:** Netlify Functions — `/api/chat` runs "Sparkle", the site assistant
  (Claude with structured JSON output when `ANTHROPIC_API_KEY` is set; a rules-based
  brain otherwise)
- **Hosting:** Netlify, deploys automatically from `main`

## Key documents

| File | What it is |
|---|---|
| `docs/SPEC.md` | The binding technical specification |
| `docs/BRAND.md` | Palette, type, voice and signature design elements |
| `docs/PLACEHOLDERS.md` | Everything awaiting real content from the client |
| `docs/reports/phase-*.md` | Build reports for each implementation phase |
| `supabase/migrations/001_init.sql` | Schema, RLS policies, RPCs and seed data (applied) |

## Local development

```bash
npm install
cp .env.example .env   # fill in the Supabase values (see netlify.toml for the public pair)
npm run dev            # http://localhost:5173
npm test               # pricing/availability/chat-brain suites
npm run build          # typecheck + production build
```

`/api/chat` only exists when deployed (or under `netlify dev`); the widget shows a
friendly fallback locally.

## The moving parts

- **Booking** (`/booking`): five-step wizard — services → property size & frequency →
  address (live postcode → area match) → date & time (availability from business
  hours, blocked slots and existing bookings via the `get_unavailable_slots` RPC) →
  details & review. Quotes price from the `service_prices` band matrix with
  frequency multipliers, bundle discounts and area surcharges (`src/lib/pricing.ts`).
  Bookings insert as `pending` with a client-generated `GA-XXXXXX` reference.
- **Admin** (`/admin`): magic-link sign-in for emails in `admin_emails`. Manage
  bookings (confirm/complete/cancel + notes), services & the price matrix,
  frequencies, bundle discounts, areas, business hours & blocked slots, contact
  messages, site settings and admin access.
- **Sparkle** (`netlify/functions/chat.ts` + `src/components/chat/`): answers
  questions from live catalogue data only, links only to real routes, and never
  invents prices. Set `ANTHROPIC_API_KEY` (and optionally `CHAT_MODEL`) in Netlify
  to enable the AI path; without it the deterministic rules brain answers.

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | netlify.toml + `.env` | Client → Supabase (public values) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Netlify UI + `.env` | Functions → Supabase |
| `ANTHROPIC_API_KEY` | Netlify UI (secret) | Enables the AI assistant |
| `CHAT_MODEL` | Netlify UI (optional) | Assistant model override (default `claude-opus-4-8`) |
