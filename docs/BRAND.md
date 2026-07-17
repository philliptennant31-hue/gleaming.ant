# Gleaming Ant — Brand & Design System

The single source of truth for how this site looks, sounds and moves.
Derived from the company's logo and Instagram presence (instagram.com/gleaming.ant).

## The business (facts — do not invent beyond these)

- **Gleaming Ant** — Window & Exterior Cleaning, Essex, UK.
- Services: window cleaning, solar panels, fascia & soffit, conservatories, gutter clearing "& more".
- Areas: Basildon, Laindon, Benfleet, Canvey Island, South Woodham Ferrers, Stanford-le-Hope + surrounding.
- Positioning from their own bio: **Reliable • Friendly • Fully Insured**, regular & one-off cleans, free quotes.
- Young, hardworking local business (launched 2026). The ant is the brand: small, diligent, stronger than it looks.
- No public phone/email yet → use `[PLACEHOLDER]` markers wired to `site_settings`.
- Currency £, UK spelling ("specialising", "colour"), UK postcodes.

## Logo

Circular badge: a dark-ink ant pushing a **squeegee** across a tilted light-aqua
window pane, white outlines, 4-point sparkle stars, an amber banner reading
GLEAMING ANT (bold italic caps), white strip beneath: WINDOW & EXTERIOR CLEANING.
Recreate as clean SVG components (see Signature elements). Official vector files
are a client TODO — flag in PLACEHOLDERS.md.

## Palette (CSS custom properties — exact values)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#22414F` | Headings, body text, dark surfaces, ant body |
| `--ink-soft` | `#48626E` | Secondary text |
| `--teal` | `#5FA8A2` | Brand mid-teal: accents, icons, links, logo circle |
| `--teal-deep` | `#2E655E` | Deep chalkboard teal: footer, hero band, dark sections |
| `--pane` | `#C9E5E2` | Light aqua tint: section washes, card hovers, the window pane |
| `--paper` | `#F6FAF9` | Page background — a cool "just-cleaned" white, NOT cream |
| `--amber` | `#E0913D` | CTA / accent ONLY. One amber element per viewport. |
| `--amber-deep` | `#C77B2B` | CTA hover / borders on amber |
| `--white` | `#FFFFFF` | Cards, banner text |

Rules: never purple, never generic blue. Amber is spent on the primary action
and tiny highlights (sparkles, active step) — if everything is amber, nothing is.
Text on `--paper`/white is `--ink` (AA+). On `--teal-deep`, use white/`--pane`.
`--teal` is large-text/decorative only on white (contrast); body links use `--teal-deep`.

## Typography

- **Display**: `Bricolage Grotesque` (variable) — headings, weights 600–800,
  tight leading (1.05–1.15), slight negative tracking on large sizes. It has
  personality; let it carry the page. h1 clamp(2.4rem → 4rem).
- **Body**: `Figtree` (variable) — 400/500/600, relaxed 1.6 leading.
- **Mono**: `Spline Sans Mono` — booking references, prices in tables, time slots.
- All via @fontsource packages, bundled (no external font CDN).

## Signature elements (the memorable stuff — build these well, keep the rest quiet)

1. **The squeegee wipe.** Section seams and image/hero reveals are cut at a
   consistent **-3° angle** (the tilt of the pane in the logo), as if a squeegee
   just wiped across. Implement as a reusable `<WipeEdge/>` divider (clip-path)
   between light and deep-teal sections. The hero headline gets a one-time
   on-load "wipe" reveal: a soft shine gradient sweeps across the text once
   (600ms, ease-out). Respect `prefers-reduced-motion` — static fallback.
2. **The ant at work.** A small SVG ant mascot (rebuilt from the logo: ink body,
   white outline, round abdomen, holding a squeegee) appears in exactly two
   places: the hero illustration and the booking stepper (Phase 2 will make it
   walk between steps). Everywhere else the brand is carried by colour and type.
3. **Sparkles.** 4-point star SVGs (white on teal, amber on paper) used sparingly
   — hero, "clean" moments (confirmation screens). Max 2–3 per composition.

Chalkboard texture: the deep-teal sections may carry a *very* subtle noise
(CSS/SVG turbulence at ~3% opacity) echoing their Instagram posts. Skip if it
reads as dirt — these sections must still feel clean.

## Layout & components

- Max content width 1152px (72rem), generous vertical rhythm (py-16/24 sections).
- Cards: white, radius 14px, 1px `--pane` border, soft shadow on hover only.
  Friendly, not corporate-sharp; no glassmorphism.
- Buttons: primary = amber bg, `--ink` text, radius 10px, bold 600; secondary =
  outline `--teal-deep`; both with visible focus rings (`outline-offset: 2px`).
- Header: sticky, paper bg with subtle border-bottom, logo left, nav centre,
  "Get an instant quote" amber button right. Mobile: hamburger → full-screen
  teal-deep sheet.
- Footer: `--teal-deep`, includes areas covered, hours, contact placeholders,
  Instagram link, "Fully insured" line, legal links.
- Trust chips (Reliable / Friendly / Fully Insured) rendered as small pane-tint
  pills with teal icons — they come from the client's own bio; use them.

## Voice

Friendly local pro, plain-spoken, zero corporate filler. Contractions welcome.
Say "we" and "your". Short sentences. British English.
- Buttons say what they do: "Get an instant quote", "Book this clean",
  "Send message", never "Submit" or "Learn more".
- No invented claims (no "10 years experience", no fake review quotes). Where
  real content is missing use visible `[PLACEHOLDER: what's needed]` markers
  and log them in docs/PLACEHOLDERS.md.
- No em dashes anywhere in site copy. Use a comma, a colon or a separate
  sentence instead.
- Avoid stock AI phrasing. Cut words and patterns like "seamless",
  "effortless" and "we've got you covered".
- Headline direction for hero (pick/refine one, don't use all):
  "The small team behind seriously clean windows." /
  "Gleaming windows. Tidy gutters. One friendly visit." /
  "Essex windows, gleaming — every 4 weeks like clockwork."

## Accessibility & quality floor (non-negotiable)

- Semantic landmarks, one h1 per page, labelled forms, keyboard navigable.
- `prefers-reduced-motion` respected on every animation.
- Focus-visible rings everywhere interactive.
- Contrast AA: run the palette as specified and it passes.
- Responsive 360px → 1440px; no horizontal scroll at any width.
