# Gleaming Ant — Technical Specification

Website + booking & management system + AI assistant for Gleaming Ant
(window & exterior cleaning, Essex). Read docs/BRAND.md for design.

## Stack (fixed — do not substitute)

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS **v4** via `@tailwindcss/vite` plugin (CSS-first config: `@import "tailwindcss";` + `@theme` tokens in `src/index.css`)
- `react-router-dom` v7 (BrowserRouter, `<Routes>`)
- `@supabase/supabase-js` v2 (anon/publishable key only — RLS is the security boundary; NO service-role key anywhere)
- Netlify Functions v2 style (`export default async (req: Request) => Response`, config via named `config` export) in `netlify/functions/`, TypeScript
- `@anthropic-ai/sdk` (functions only), `lucide-react` icons, `@fontsource-variable/*` fonts
- Vitest for unit tests
- Hosting: Netlify (site `gleaming-ant`, URL https://gleaming-ant.netlify.app), repo `philliptennant31-hue/gleaming.ant`, deploy on push to `main`. `netlify.toml` already in repo — do not modify.

## Environment

Client: `import.meta.env.VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (already in `.env` + netlify.toml).
Functions: `process.env.SUPABASE_URL` / `SUPABASE_ANON_KEY` (fall back to the public values hardcoded as constants — they are public by design), `ANTHROPIC_API_KEY` (optional), `CHAT_MODEL` (optional, default `claude-opus-4-8`).

## Database

Schema, RLS and seeds live in `supabase/migrations/001_init.sql` (already applied to the live project — treat as ground truth). Key points:

- Public (anon) can: SELECT active catalogue rows (`services`, `service_prices`, `property_bands`, `frequencies`, `bundle_discounts`, `service_areas`, `business_hours`, `faqs`, `site_settings`); INSERT `bookings` (status forced `pending`) and `contact_messages` (status `new`); call RPC `get_unavailable_slots(from_date, to_date)`.
- Admins (Supabase Auth users whose email is in `admin_emails`, checked via `is_admin()`) can do everything. Admin auth = **magic link / email OTP** (`supabase.auth.signInWithOtp`), no passwords.
- Booking `reference` is DB-generated (`GA-XXXXXX`) — read it back from the insert `.select()`.

## Shared TypeScript types — `src/lib/types.ts` (Phase 1 creates EXACTLY this shape)

```ts
export interface Service {
  id: string; slug: string; name: string;
  short_description: string; long_description: string;
  base_price: number; unit_label: string; duration_minutes: number;
  supports_frequency: boolean; price_note: string; icon: string;
  is_active: boolean; sort_order: number;
}
export interface PropertyBand { code: string; label: string; sort_order: number; }
export interface ServicePrice { id: string; service_id: string; band_code: string; price: number; }
export interface Frequency { code: string; label: string; multiplier: number; sort_order: number; is_active: boolean; }
export interface BundleDiscount { id: string; min_services: number; discount_percent: number; is_active: boolean; }
export interface ServiceArea { id: string; name: string; postcode_prefixes: string[]; surcharge: number; is_core: boolean; is_active: boolean; sort_order: number; }
export interface BusinessHours { day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null; }
export interface Faq { id: string; question: string; answer: string; category: string; sort_order: number; is_active: boolean; }
export interface BookingItem { service_id: string; slug: string; name: string; unit_price: number; line_total: number; }
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export interface Booking {
  id: string; reference: string; status: BookingStatus;
  customer_name: string; email: string; phone: string;
  address_line1: string; address_line2: string; city: string; postcode: string;
  area_name: string; property_band: string; frequency: string;
  service_date: string; start_time: string; duration_minutes: number;
  items: BookingItem[]; subtotal: number; discount_amount: number;
  surcharge_amount: number; total: number;
  customer_notes: string; admin_notes: string; created_at: string; updated_at: string;
}
export interface ContactMessage { id: string; name: string; email: string; phone: string; message: string; status: 'new'|'read'|'replied'|'archived'; created_at: string; }
export interface UnavailableSlot { on_date: string; start_time: string; end_time: string; }
export interface SiteSettings {
  contact: { phone: string; email: string; whatsapp: string };
  social: { instagram: string; facebook: string };
  booking: { slot_interval_minutes: number; min_notice_hours: number; max_days_ahead: number };
  business: { name: string; tagline: string; area: string; domain: string };
}
```

`src/lib/supabase.ts`: create + export a single client. `src/lib/settings.ts`: `useSiteSettings()` hook fetching all `site_settings` rows into `SiteSettings` (with sane defaults while loading). `src/lib/format.ts`: `formatGBP(n)` (£, 2dp, drop .00), `formatDate`, `formatTime`.

## Routes (Phase 1 registers ALL of them; stubs for later phases)

| Path | Page | Phase |
|---|---|---|
| `/` | Home | 1 |
| `/services`, `/services/:slug` | Services list + detail | 1 |
| `/pricing` | Price list (bands × services table) + link to quote | 1 |
| `/areas` | Areas covered | 1 |
| `/about` | About | 1 |
| `/faq` | FAQ (from DB) | 1 |
| `/contact` | Contact form (→ `contact_messages`) + details | 1 |
| `/privacy`, `/terms` | Legal placeholders | 1 |
| `/booking` | Booking wizard | **2** (Phase 1 stub) |
| `/booking/confirmed` | Confirmation (reads router state) | **2** (stub) |
| `/admin/login` | Magic-link login | **3** (stub) |
| `/admin/*` | Dashboard shell + subpages | **3** (stub) |
| `*` | 404 | 1 |

Stub = a real routed component in the owning phase's directory rendering a branded "coming soon" card. Later phases REPLACE stub file contents; they never edit `App.tsx`.

## Quote engine (Phase 2, pure functions in `src/lib/pricing.ts` + vitest)

```
quoteInput = { selectedServiceIds, bandCode, frequencyCode, postcode }
1. line price per service = service_prices[service, band]   (fallback service.base_price)
   × frequency.multiplier IF service.supports_frequency ELSE × 1
2. subtotal = Σ line prices
3. bundle discount = highest bundle_discounts.discount_percent where
   min_services ≤ count(selected)  → discount_amount = subtotal × pct/100
4. area match: normalise postcode (upper, strip spaces), match against
   service_areas by LONGEST matching prefix; matched → surcharge; no match →
   quote still shown, flagged `outsideArea: true` ("we'll confirm by message")
5. total = subtotal − discount + surcharge  (round to 2dp at each step)
duration = Σ service.duration_minutes (single-crew assumption)
```

Availability (`src/lib/availability.ts`): slots on a date = from business_hours open→close, step `slot_interval_minutes`, keep slot if `[slot, slot+duration] ≤ close` and it doesn't overlap any `get_unavailable_slots` row; exclude dates < today + `min_notice_hours`; horizon `max_days_ahead`.

Booking wizard steps: 1 Services → 2 Property & frequency → 3 Postcode/address → 4 Date & time → 5 Details & review → insert → confirmation (reference, breakdown, "we'll confirm by message"). Live quote panel visible from step 1. The ant walks along the stepper (BRAND.md).

## Admin (Phase 3, `/admin`)

Guard: session email must be in `admin_emails` (query it; on RLS-denied treat as non-admin → sign out + message). Pages: Dashboard (today/upcoming/pending counts), Bookings (filter by status/date, detail drawer, status transitions pending→confirmed→completed / cancel, edit admin_notes), Services & Pricing (CRUD services, edit price matrix, bundle discounts, frequencies), Areas (CRUD), Availability (business hours editor + blocked slots CRUD), Messages (contact inbox, status flow), Settings (site_settings editor incl. contact details). Plain, fast, table-first UI reusing brand tokens; desktop-first but usable on mobile.

## Chatbot (Phase 4)

`netlify/functions/chat.ts` → POST `/api/chat` `{ messages: [{role:'user'|'assistant', content:string}], page?: string }` → `{ reply: string, links: {label:string, path:string}[], suggested_replies: string[], source: 'ai'|'rules' }`.

- Server fetches services/faqs/areas/settings/bands/frequencies/discounts from Supabase (anon key) to build a system prompt: identity ("Sparkle, the Gleaming Ant assistant"), the data, the route map, STRICT rules (only Gleaming Ant topics; never invent prices/policies — quote the price list or say the team will confirm; UK tone; ≤120 words per reply; recommend `/booking` for quotes; refuse unrelated/abusive requests politely).
- If `ANTHROPIC_API_KEY` set: `@anthropic-ai/sdk`, model from `CHAT_MODEL` (default `claude-opus-4-8`), `max_tokens: 700`, NO sampling params, NO thinking param, `output_config: { format: { type: 'json_schema', schema } }` forcing the response shape; parse with typed SDK errors → on any failure fall through to rules.
- Rules fallback (always shipped, also used when no key): keyword intent matching over FAQ questions, service names/synonyms (gutters, solar…), pricing (→ price list + `/pricing`), booking (→ `/booking`), areas (postcode prefix check), contact, greeting, fallback ("message the team") — each returning the same JSON shape.
- Validate: ≤12 messages, each ≤600 chars, else 400. CORS same-origin. Truncate history to last 8 turns before sending to the API.
- Widget `src/components/chat/ChatWidget.tsx`: floating amber button (bottom-right, ant icon), opens 380px panel (mobile: full-width sheet): header "Sparkle — here to help", messages, suggested-reply chips, link buttons (react-router navigation), typing indicator, sessionStorage persistence, Esc/click-away close, accessible (role=dialog, focus trap).

## Conventions (all phases)

- Placeholder content = visible `[PLACEHOLDER: description]` + entry in `docs/PLACEHOLDERS.md`.
- Every data fetch: loading state + friendly error state ("Something went wrong — try again or message us").
- No new npm deps beyond package.json (Phase 1 installs the complete list).
- `npm run build` and `npx tsc --noEmit` must pass before a phase reports done.
- Each phase writes `docs/reports/phase-N.md`: what was built, decisions, anything needing review.
- File ownership is strict: Phase 2 = `src/pages/booking/**`, `src/lib/pricing.ts`, `src/lib/availability.ts`, `src/lib/__tests__/**`; Phase 3 = `src/pages/admin/**`, `src/components/admin/**`; Phase 4 = `netlify/functions/**`, `src/components/chat/**`. Nobody edits shared files after Phase 1 — if you believe a shared file must change, write the need into your report instead and stop short of editing it.
