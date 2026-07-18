-- ============================================================
-- Gleaming Ant â€” 003: mirror the live client site
-- ------------------------------------------------------------
-- Source of truth: the client's own live site gleamingant.co.uk
-- (scraped 2026-07-18). This migration replaces our earlier
-- guessed/placeholder catalogue data with the real business
-- data: the full service menu, Essex-wide coverage, real contact
-- details, and confirmed FAQ answers.
--
-- Idempotent: safe to run once on the already-seeded live DB, and
-- safe to re-run. Rows are matched by slug / name / question / key
-- (never by id). New rows use guarded INSERTs / ON CONFLICT so a
-- re-run neither duplicates nor clobbers later admin edits.
--
-- 001_init.sql and 002_copy_polish.sql are applied history and are
-- left untouched; this file is the delta.
--
-- NOTE (needs Antony's confirmation, tracked in docs/PLACEHOLDERS.md):
--   * Guide prices for the five new services are our estimates.
--   * Postcode-prefix boundaries per town are inferred from UK
--     postcode geography. Several outcodes intentionally appear in
--     more than one town row; because every area carries a Â£0.00
--     surcharge, any longest-prefix match is equivalent for pricing.
-- ============================================================

-- ------------------------------------------------------------
-- a) SERVICES â€” mirror the client's catalogue and running order
-- ------------------------------------------------------------

-- Core window cleaning stays put at the top.
update public.services set sort_order = 0 where slug = 'window-cleaning';

-- Rename gutter-clearing -> gutter-cleaning (their menu wording) and reorder.
update public.services
   set slug = 'gutter-cleaning',
       name = 'Gutter Cleaning',
       sort_order = 3
 where slug = 'gutter-clearing';

-- Reorder the services we already offer to slot around the new ones.
update public.services set sort_order = 5 where slug = 'solar-panel-cleaning';
update public.services set is_active = true, sort_order = 8 where slug = 'fascia-soffit';
update public.services set is_active = true, sort_order = 9 where slug = 'conservatory-cleaning';

-- Retire the old combined driveway+patio service: superseded by the
-- split into driveway-cleaning + patio-cleaning below. Keep the row
-- (bookings may reference it); just hide it.
update public.services set is_active = false where slug = 'pressure-washing';

-- The five new services from their menu. Guide prices pending Antony's
-- confirmation; roof/render/brickwork are survey-priced in reality.
insert into public.services
  (slug, name, short_description, long_description, base_price, unit_label, duration_minutes, supports_frequency, price_note, icon, is_active, sort_order)
values
  ('driveway-cleaning', 'Driveway Cleaning',
   'Restoring driveways to a cleaner, smarter finish.',
   'A thorough pressure clean to lift dirt, moss and stains and restore your driveway to a cleaner, smarter finish. Great for block paving, concrete and stone. The price shown is a guide, confirmed once we know the size and surface.',
   90.00, 'per visit', 150, false,
   'Guide price, confirmed with Antony before we book.', 'pressure', true, 1),

  ('roof-cleaning', 'Roof Cleaning',
   'Removing moss, algae and built-up debris, safely.',
   'We clear moss, algae and built-up debris to protect your roof and tidy the whole look of your home. Roof work is quoted from a quick survey or a few photos, so the price shown is a starting guide.',
   395.00, 'per visit', 300, false,
   'Guide price. Roof cleans are confirmed after a quick survey or a few photos.', 'roof', true, 2),

  ('patio-cleaning', 'Patio Cleaning',
   'Bringing patios and outdoor spaces back to their best.',
   'A deep clean to shift grime, algae and weeds and bring your patio and outdoor space back to their best, ready for the sunshine. The price shown is a guide, confirmed once we know the size and surface.',
   70.00, 'per visit', 120, false,
   'Guide price, confirmed with Antony before we book.', 'pressure', true, 4),

  ('render-cleaning', 'Render Cleaning',
   'Lifting dirt, algae and staining from your exterior walls.',
   'We safely remove dirt, algae and staining from rendered walls to freshen up your exterior. Rendered surfaces vary, so the price shown is a guide, confirmed after a quick survey or a few photos.',
   150.00, 'per visit', 180, false,
   'Guide price. Confirmed after a quick survey or a few photos.', 'render', true, 6),

  ('brickwork-cleaning', 'Brickwork Cleaning',
   'Restoring the look of brick surfaces, with care.',
   'Careful cleaning to lift dirt, moss and staining and restore the appearance of brick surfaces. Every wall is different, so the price shown is a guide, confirmed after a quick survey or a few photos.',
   150.00, 'per visit', 180, false,
   'Guide price. Confirmed after a quick survey or a few photos.', 'brick', true, 7)
on conflict (slug) do nothing;

-- Band prices for the five new services (guide prices). Mirrors the
-- CASE cross-join pattern used in 001; only fills gaps, never clobbers.
insert into public.service_prices (service_id, band_code, price)
select s.id, b.code,
  case s.slug
    when 'driveway-cleaning'  then case b.code when 'band_1_2' then 90.00  when 'band_3' then 110.00 when 'band_4' then 130.00 else 150.00 end
    when 'roof-cleaning'      then case b.code when 'band_1_2' then 395.00 when 'band_3' then 450.00 when 'band_4' then 550.00 else 650.00 end
    when 'patio-cleaning'     then case b.code when 'band_1_2' then 70.00  when 'band_3' then 85.00  when 'band_4' then 100.00 else 120.00 end
    when 'render-cleaning'    then case b.code when 'band_1_2' then 150.00 when 'band_3' then 180.00 when 'band_4' then 220.00 else 260.00 end
    when 'brickwork-cleaning' then case b.code when 'band_1_2' then 150.00 when 'band_3' then 180.00 when 'band_4' then 220.00 else 260.00 end
  end
from public.services s
cross join public.property_bands b
where s.slug in ('driveway-cleaning','roof-cleaning','patio-cleaning','render-cleaning','brickwork-cleaning')
on conflict (service_id, band_code) do nothing;

-- ------------------------------------------------------------
-- b) SERVICE AREAS â€” their Essex-wide coverage, zero surcharge
-- ------------------------------------------------------------

-- Their base and headline area is "Basildon"; rename our old combined
-- row so the upsert below updates it in place (prefixes are unchanged).
update public.service_areas set name = 'Basildon' where name = 'Basildon & Laindon';

-- Drop the old surcharged catch-all (their site has no travel surcharge).
delete from public.service_areas where name = 'Surrounding Essex';

-- Old core towns that are not on their coverage list: hide rather than
-- delete (reversible; nothing references service_areas by FK). Any of
-- their postcodes now fall through to the Essex-wide catch-all below.
update public.service_areas
   set is_active = false
 where name in ('Benfleet', 'Canvey Island', 'Stanford-le-Hope');

-- Upsert their coverage (match by name; no unique constraint on name,
-- so UPDATE-then-guarded-INSERT). All surcharge 0.00. The 15 towns are
-- core, in their listed order; the Essex-wide row is the non-core
-- catch-all, sorted last.
update public.service_areas sa set
       postcode_prefixes = v.prefixes,
       surcharge = 0.00,
       is_core = v.is_core,
       is_active = true,
       sort_order = v.sort_order
  from (values
    ('Billericay',                        '{CM12,CM11}'::text[],           true,  1),
    ('Basildon',                          '{SS13,SS14,SS15,SS16}'::text[], true,  2),
    ('Wickford',                          '{SS11,SS12}'::text[],           true,  3),
    ('Brentwood',                         '{CM14,CM13,CM15}'::text[],      true,  4),
    ('Shenfield',                         '{CM15}'::text[],                true,  5),
    ('Hutton',                            '{CM13}'::text[],                true,  6),
    ('Ingatestone',                       '{CM4}'::text[],                 true,  7),
    ('Stock',                             '{CM4}'::text[],                 true,  8),
    ('Ramsden Heath',                     '{CM11}'::text[],                true,  9),
    ('Mountnessing',                      '{CM15}'::text[],                true, 10),
    ('Chelmsford',                        '{CM1,CM2}'::text[],             true, 11),
    ('Danbury',                           '{CM3}'::text[],                 true, 12),
    ('Great Baddow',                      '{CM2}'::text[],                 true, 13),
    ('Rayleigh',                          '{SS6}'::text[],                 true, 14),
    ('South Woodham Ferrers',             '{CM3}'::text[],                 true, 15),
    ('Essex & surrounding areas',  '{SS,CM,CO,RM,IG}'::text[],      false, 99)
  ) as v(name, prefixes, is_core, sort_order)
 where sa.name = v.name;

insert into public.service_areas (name, postcode_prefixes, surcharge, is_core, is_active, sort_order)
select v.name, v.prefixes, 0.00, v.is_core, true, v.sort_order
  from (values
    ('Billericay',                        '{CM12,CM11}'::text[],           true,  1),
    ('Basildon',                          '{SS13,SS14,SS15,SS16}'::text[], true,  2),
    ('Wickford',                          '{SS11,SS12}'::text[],           true,  3),
    ('Brentwood',                         '{CM14,CM13,CM15}'::text[],      true,  4),
    ('Shenfield',                         '{CM15}'::text[],                true,  5),
    ('Hutton',                            '{CM13}'::text[],                true,  6),
    ('Ingatestone',                       '{CM4}'::text[],                 true,  7),
    ('Stock',                             '{CM4}'::text[],                 true,  8),
    ('Ramsden Heath',                     '{CM11}'::text[],                true,  9),
    ('Mountnessing',                      '{CM15}'::text[],                true, 10),
    ('Chelmsford',                        '{CM1,CM2}'::text[],             true, 11),
    ('Danbury',                           '{CM3}'::text[],                 true, 12),
    ('Great Baddow',                      '{CM2}'::text[],                 true, 13),
    ('Rayleigh',                          '{SS6}'::text[],                 true, 14),
    ('South Woodham Ferrers',             '{CM3}'::text[],                 true, 15),
    ('Essex & surrounding areas',  '{SS,CM,CO,RM,IG}'::text[],      false, 99)
  ) as v(name, prefixes, is_core, sort_order)
 where not exists (
   select 1 from public.service_areas sa where sa.name = v.name
 );

-- ------------------------------------------------------------
-- c) FAQs â€” confirm the answers their site now makes public
-- ------------------------------------------------------------

-- Commercial work is confirmed (was a placeholder).
update public.faqs
   set answer = 'Yes. As well as homes, we clean offices, shops, schools and a wide range of commercial buildings. Tell us what you need and we''ll sort a quote.'
 where question = 'Do you clean commercial properties?';

-- Coverage answer: Essex-wide from our Basildon base, no surcharge.
update public.faqs
   set answer = 'We''re based in Basildon and cover Essex county-wide, including Billericay, Wickford, Brentwood, Shenfield, Chelmsford, Rayleigh, South Woodham Ferrers and many more towns and villages. Not sure about your postcode? Enter it in the booking tool or drop us a message and we''ll confirm.'
 where question = 'Which areas do you cover?';

-- New FAQ: reminders before every visit (a promise on their site).
insert into public.faqs (question, answer, category, sort_order)
select 'Will you remind me before a visit?',
       'Yes. We send a friendly reminder before every visit, so you always know when we''re coming and can make sure we have access.',
       'general', 9
where not exists (
  select 1 from public.faqs where question = 'Will you remind me before a visit?'
);

-- ------------------------------------------------------------
-- d) SETTINGS â€” real contact details
-- ------------------------------------------------------------
-- whatsapp is stored as digits only: Contact.tsx / Footer.tsx build the
-- link as https://wa.me/<digits>, giving https://wa.me/447497386385.
update public.site_settings
   set value = '{"phone": "07497 386385", "email": "hello@gleamingant.co.uk", "whatsapp": "447497386385"}'::jsonb
 where key = 'contact';
