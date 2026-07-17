-- ============================================================
-- Gleaming Ant — 002: copy polish
-- ------------------------------------------------------------
-- Rewrites the seeded marketing copy to drop em dashes and
-- stock AI phrasing, matching the refreshed text in
-- 001_init.sql. Rows are matched by slug / question (never by
-- id) so this applies cleanly to the live database. Any
-- [PLACEHOLDER: ...] markers are kept verbatim.
-- ============================================================

-- Services -----------------------------------------------------

update public.services
   set short_description = 'Crystal-clear windows, frames and sills, every time.'
 where slug = 'window-cleaning';

update public.services
   set long_description = 'Leaves, moss and debris out, keeping your home safe from damp and overflow damage. We clear all gutters and downpipes and check the flow before we leave. [PLACEHOLDER: confirm equipment — e.g. camera-guided vacuum system]'
 where slug = 'gutter-clearing';

update public.services
   set short_description = 'Brighten the whole frontage: fascias, soffits and gutter faces.'
 where slug = 'fascia-soffit';

update public.services
   set short_description = 'Roof, glass and frames: let the light back in.',
       long_description  = 'Full conservatory clean including roof panels, glass, frames and sills. Sized quotes depend on your conservatory, so the price shown is a guide. [PLACEHOLDER: confirm whether roof cleaning is included or priced separately]',
       price_note        = 'Guide price, depends on conservatory size'
 where slug = 'conservatory-cleaning';

update public.services
   set short_description = 'Clean panels generate more and protect your investment.',
       price_note        = 'Guide price, depends on number of panels'
 where slug = 'solar-panel-cleaning';

update public.services
   set short_description = 'Lift the grime: driveways, patios and paths renewed.',
       price_note        = 'Placeholder service, awaiting confirmation'
 where slug = 'pressure-washing';

-- FAQs ---------------------------------------------------------

update public.faqs
   set answer = 'Yes, Gleaming Ant is fully insured, so your home is protected while we work.'
 where question = 'Are you insured?';

update public.faqs
   set answer = 'Use our online booking tool for an instant quote based on your property and the services you need, or send us a message. Quotes are always free.'
 where question = 'How do I get a quote?';

update public.faqs
   set answer = 'Not usually. As long as we can access the areas that need cleaning (for example, a side gate to the back garden), you don''t need to be in. [PLACEHOLDER: confirm access/payment arrangements when customer is out]'
 where question = 'Do I need to be home when you clean?';

update public.faqs
   set answer = 'Light rain doesn''t affect a professional clean, and your windows will still dry clear. If the weather is bad enough to affect the result, we''ll rearrange your visit. [PLACEHOLDER: confirm rain guarantee policy]'
 where question = 'What happens if it rains?';

update public.faqs
   set answer = 'Most of our customers choose a regular clean every 4 or 8 weeks. It keeps windows consistently spotless and costs less per visit than a one-off.'
 where question = 'How often should I have my windows cleaned?';
