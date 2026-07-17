-- ============================================================
-- Gleaming Ant — initial schema, RLS, RPCs and seed data
-- Apply via Supabase SQL editor (or supabase db push).
-- Prices/hours/FAQ text marked [PLACEHOLDER] need client sign-off.
-- ============================================================

-- ---------- ADMIN ALLOWLIST ----------
create table public.admin_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

-- security definer so RLS policies can consult the allowlist
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- LOOKUPS ----------
create table public.property_bands (
  code text primary key,          -- band_1_2 | band_3 | band_4 | band_5p
  label text not null,
  sort_order integer not null default 0
);

create table public.frequencies (
  code text primary key,          -- every_4_weeks | every_8_weeks | one_off
  label text not null,
  multiplier numeric(4,2) not null default 1.00,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.bundle_discounts (
  id uuid primary key default gen_random_uuid(),
  min_services integer not null unique,
  discount_percent numeric(5,2) not null,
  is_active boolean not null default true
);

-- ---------- SERVICES & PRICING ----------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text not null default '',
  long_description text not null default '',
  base_price numeric(8,2) not null default 0,      -- "from" price shown in listings
  unit_label text not null default 'per visit',
  duration_minutes integer not null default 60,
  supports_frequency boolean not null default false, -- regular-clean pricing applies
  price_note text not null default '',
  icon text not null default 'sparkles',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  band_code text not null references public.property_bands(code),
  price numeric(8,2) not null,
  unique (service_id, band_code)
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  postcode_prefixes text[] not null default '{}',
  surcharge numeric(8,2) not null default 0,
  is_core boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

-- ---------- AVAILABILITY ----------
create table public.business_hours (
  day_of_week integer primary key check (day_of_week between 0 and 6), -- 0 = Sunday
  is_open boolean not null default false,
  open_time time,
  close_time time
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- BOOKINGS ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('GA-' || upper(substr(md5(random()::text), 1, 6))),
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled')),
  customer_name text not null,
  email text not null,
  phone text not null default '',
  address_line1 text not null,
  address_line2 text not null default '',
  city text not null default '',
  postcode text not null,
  area_name text not null default '',
  property_band text not null default '',
  frequency text not null default 'one_off',
  service_date date not null,
  start_time time not null,
  duration_minutes integer not null default 60,
  items jsonb not null default '[]'::jsonb,  -- [{service_id, slug, name, unit_price, line_total}]
  subtotal numeric(8,2) not null default 0,
  discount_amount numeric(8,2) not null default 0,
  surcharge_amount numeric(8,2) not null default 0,
  total numeric(8,2) not null default 0,
  customer_notes text not null default '',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_date_idx on public.bookings (service_date);
create index bookings_status_idx on public.bookings (status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------- CONTACT & CONTENT ----------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  status text not null default 'new'
    check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- RPC: availability without exposing PII ----------
create or replace function public.get_unavailable_slots(from_date date, to_date date)
returns table (on_date date, start_time time, end_time time)
language sql stable security definer
set search_path = public
as $$
  select b.service_date,
         b.start_time,
         (b.start_time + make_interval(mins => b.duration_minutes))::time
  from public.bookings b
  where b.service_date between from_date and to_date
    and b.status in ('pending','confirmed')
  union all
  select bs.date, bs.start_time, bs.end_time
  from public.blocked_slots bs
  where bs.date between from_date and to_date;
$$;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.admin_emails     enable row level security;
alter table public.property_bands   enable row level security;
alter table public.frequencies      enable row level security;
alter table public.bundle_discounts enable row level security;
alter table public.services         enable row level security;
alter table public.service_prices   enable row level security;
alter table public.service_areas    enable row level security;
alter table public.business_hours   enable row level security;
alter table public.blocked_slots    enable row level security;
alter table public.bookings         enable row level security;
alter table public.contact_messages enable row level security;
alter table public.faqs             enable row level security;
alter table public.site_settings    enable row level security;

-- Public catalogue reads (active rows only; admins see everything)
create policy "public read property_bands" on public.property_bands
  for select using (true);
create policy "public read frequencies" on public.frequencies
  for select using (is_active or public.is_admin());
create policy "public read bundle_discounts" on public.bundle_discounts
  for select using (is_active or public.is_admin());
create policy "public read services" on public.services
  for select using (is_active or public.is_admin());
create policy "public read service_prices" on public.service_prices
  for select using (true);
create policy "public read service_areas" on public.service_areas
  for select using (is_active or public.is_admin());
create policy "public read business_hours" on public.business_hours
  for select using (true);
create policy "public read faqs" on public.faqs
  for select using (is_active or public.is_admin());
create policy "public read site_settings" on public.site_settings
  for select using (true);

-- Public writes: bookings + contact messages only, forced to initial status
create policy "anon create booking" on public.bookings
  for insert with check (status = 'pending');
create policy "anon create contact message" on public.contact_messages
  for insert with check (status = 'new');

-- blocked_slots: no public select (reasons may be private) — exposed via RPC only
create policy "admin read blocked_slots" on public.blocked_slots
  for select using (public.is_admin());

-- Admin full access everywhere
create policy "admin all admin_emails" on public.admin_emails
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all property_bands" on public.property_bands
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all frequencies" on public.frequencies
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all bundle_discounts" on public.bundle_discounts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all services" on public.services
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all service_prices" on public.service_prices
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all service_areas" on public.service_areas
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all business_hours" on public.business_hours
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all blocked_slots" on public.blocked_slots
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all bookings" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all contact_messages" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all faqs" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all site_settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- SEED DATA  ([PLACEHOLDER] values need client confirmation)
-- ============================================================

insert into public.admin_emails (email) values
  ('phillip.tennant31@gmail.com');

insert into public.property_bands (code, label, sort_order) values
  ('band_1_2', '1–2 bedrooms', 0),
  ('band_3',   '3 bedrooms',   1),
  ('band_4',   '4 bedrooms',   2),
  ('band_5p',  '5+ bedrooms',  3);

insert into public.frequencies (code, label, multiplier, sort_order) values
  ('every_4_weeks', 'Every 4 weeks (regular)', 1.00, 0),
  ('every_8_weeks', 'Every 8 weeks (regular)', 1.15, 1),
  ('one_off',       'One-off clean',           1.35, 2);

insert into public.bundle_discounts (min_services, discount_percent) values
  (2, 10.00),
  (3, 15.00);

insert into public.services
  (slug, name, short_description, long_description, base_price, unit_label, duration_minutes, supports_frequency, price_note, icon, is_active, sort_order)
values
  ('window-cleaning', 'Window Cleaning',
   'Crystal-clear windows, frames and sills, every time.',
   'Our core service. We clean your windows, frames, sills and doors for a streak-free finish that lasts. Choose a regular 4- or 8-weekly clean for the best price, or book a one-off spruce-up. [PLACEHOLDER: confirm method — e.g. pure water reach & wash system]',
   15.00, 'per visit', 45, true,
   'Prices are placeholders pending confirmation', 'window', true, 0),

  ('gutter-clearing', 'Gutter Clearing',
   'Blocked gutters emptied, checked and flowing again.',
   'Leaves, moss and debris out, keeping your home safe from damp and overflow damage. We clear all gutters and downpipes and check the flow before we leave. [PLACEHOLDER: confirm equipment — e.g. camera-guided vacuum system]',
   70.00, 'per visit', 90, false,
   'Prices are placeholders pending confirmation', 'gutter', true, 1),

  ('fascia-soffit', 'Fascia & Soffit Cleaning',
   'Brighten the whole frontage: fascias, soffits and gutter faces.',
   'We wash down fascias, soffits and external gutter faces to lift years of grime and bring back the white. Ideal alongside a gutter clear.',
   80.00, 'per visit', 120, false,
   'Prices are placeholders pending confirmation', 'fascia', true, 2),

  ('conservatory-cleaning', 'Conservatory Cleaning',
   'Roof, glass and frames: let the light back in.',
   'Full conservatory clean including roof panels, glass, frames and sills. Sized quotes depend on your conservatory, so the price shown is a guide. [PLACEHOLDER: confirm whether roof cleaning is included or priced separately]',
   50.00, 'per visit', 90, true,
   'Guide price, depends on conservatory size', 'conservatory', true, 3),

  ('solar-panel-cleaning', 'Solar Panel Cleaning',
   'Clean panels generate more and protect your investment.',
   'Dirty solar panels can lose a meaningful share of their output. We clean them safely with the right equipment and no harsh chemicals. [PLACEHOLDER: confirm price basis — per panel or per system]',
   75.00, 'per visit', 90, false,
   'Guide price, depends on number of panels', 'solar', true, 4),

  ('pressure-washing', 'Driveway & Patio Pressure Washing',
   'Lift the grime: driveways, patios and paths renewed.',
   '[PLACEHOLDER: confirm this service is offered — listed as "& more" on Instagram]',
   90.00, 'per visit', 150, false,
   'Placeholder service, awaiting confirmation', 'pressure', false, 5);

insert into public.service_prices (service_id, band_code, price)
select s.id, b.code,
  case
    when s.slug = 'window-cleaning' then
      case b.code when 'band_1_2' then 15.00 when 'band_3' then 20.00 when 'band_4' then 25.00 else 30.00 end
    when s.slug = 'gutter-clearing' then
      case b.code when 'band_1_2' then 70.00 when 'band_3' then 80.00 when 'band_4' then 95.00 else 110.00 end
    when s.slug = 'fascia-soffit' then
      case b.code when 'band_1_2' then 80.00 when 'band_3' then 100.00 when 'band_4' then 120.00 else 140.00 end
    when s.slug = 'conservatory-cleaning' then
      case b.code when 'band_1_2' then 50.00 when 'band_3' then 60.00 when 'band_4' then 70.00 else 80.00 end
    when s.slug = 'solar-panel-cleaning' then
      case b.code when 'band_1_2' then 75.00 when 'band_3' then 85.00 when 'band_4' then 95.00 else 110.00 end
    else
      case b.code when 'band_1_2' then 90.00 when 'band_3' then 110.00 when 'band_4' then 130.00 else 150.00 end
  end
from public.services s
cross join public.property_bands b;

insert into public.service_areas (name, postcode_prefixes, surcharge, is_core, sort_order) values
  ('Basildon & Laindon',    '{SS13,SS14,SS15,SS16}', 0.00, true,  0),
  ('Benfleet',              '{SS7}',                 0.00, true,  1),
  ('Canvey Island',         '{SS8}',                 0.00, true,  2),
  ('South Woodham Ferrers', '{CM3}',                 0.00, true,  3),
  ('Stanford-le-Hope',      '{SS17}',                0.00, true,  4),
  ('Surrounding Essex',     '{SS,CM}',               7.50, false, 5);

-- [PLACEHOLDER] hours pending confirmation
insert into public.business_hours (day_of_week, is_open, open_time, close_time) values
  (0, false, null, null),
  (1, true, '08:00', '17:00'),
  (2, true, '08:00', '17:00'),
  (3, true, '08:00', '17:00'),
  (4, true, '08:00', '17:00'),
  (5, true, '08:00', '17:00'),
  (6, true, '09:00', '14:00');

insert into public.faqs (question, answer, category, sort_order) values
  ('Are you insured?',
   'Yes, Gleaming Ant is fully insured, so your home is protected while we work.',
   'general', 0),
  ('How do I get a quote?',
   'Use our online booking tool for an instant quote based on your property and the services you need, or send us a message. Quotes are always free.',
   'pricing', 1),
  ('Do I need to be home when you clean?',
   'Not usually. As long as we can access the areas that need cleaning (for example, a side gate to the back garden), you don''t need to be in. [PLACEHOLDER: confirm access/payment arrangements when customer is out]',
   'general', 2),
  ('What happens if it rains?',
   'Light rain doesn''t affect a professional clean, and your windows will still dry clear. If the weather is bad enough to affect the result, we''ll rearrange your visit. [PLACEHOLDER: confirm rain guarantee policy]',
   'general', 3),
  ('How often should I have my windows cleaned?',
   'Most of our customers choose a regular clean every 4 or 8 weeks. It keeps windows consistently spotless and costs less per visit than a one-off.',
   'services', 4),
  ('Which areas do you cover?',
   'We cover Basildon, Laindon, Benfleet, Canvey Island, South Woodham Ferrers, Stanford-le-Hope and surrounding Essex areas. Not sure? Enter your postcode in the booking tool or drop us a message.',
   'general', 5),
  ('How do I pay?',
   '[PLACEHOLDER: confirm payment methods — e.g. bank transfer, card, GoCardless direct debit]',
   'pricing', 6),
  ('Do you clean commercial properties?',
   '[PLACEHOLDER: confirm commercial offering — shops, offices, schools etc.]',
   'services', 7);

insert into public.site_settings (key, value) values
  ('contact', '{"phone": "[PLACEHOLDER]", "email": "[PLACEHOLDER]", "whatsapp": "[PLACEHOLDER]"}'),
  ('social',  '{"instagram": "https://www.instagram.com/gleaming.ant/", "facebook": ""}'),
  ('booking', '{"slot_interval_minutes": 30, "min_notice_hours": 24, "max_days_ahead": 60}'),
  ('business','{"name": "Gleaming Ant", "tagline": "Window & Exterior Cleaning", "area": "Essex", "domain": "gleamingant.co.uk"}');
