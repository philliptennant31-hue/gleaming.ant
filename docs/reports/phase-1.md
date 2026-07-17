# Phase 1 report — Foundation, brand system & public site

Status: **complete**. All quality gates pass.

```
npm install       → 99 packages, 0 vulnerabilities
npx tsc --noEmit  → exit 0
npm run build     → exit 0 (tsc --noEmit && vite build)
npm test          → exit 0 (vitest, no test files yet — Phase 2 owns lib tests)
```

## What was built

**Scaffold & config** — `package.json` (dev/build/preview/test + a `typecheck` helper),
`vite.config.ts` (React + Tailwind v4 plugin), strict `tsconfig.json`, `index.html`
with full SEO head (title, description, OG/Twitter, `theme-color` #2E655E, JSON-LD
`HomeAndConstructionBusiness` with `areaServed`), `src/index.css` (Tailwind v4
`@theme` mapping the whole BRAND palette + type + radii tokens, plus the signature
keyframes), `src/vite-env.d.ts`.

**Brand components** (`src/components/brand/`) — `Logo` (SVG ant badge + wordmark
lockup, `tone` + `withTagline`), `AntMascot` (ink ant pushing a squeegee, depth-layered
SVG, sizeable, optional a11y title), `Sparkle` (4-point star, `currentColor`),
`WipeEdge` (the −3° squeegee seam), `ServiceIcon` (maps `services.icon` → lucide),
`icons.tsx` (`InstagramIcon`, see deviations).

**Shared lib** (`src/lib/`) — `types.ts` (verbatim from SPEC), `supabase.ts` (single
anon client), `settings.ts` (`useSiteSettings` with defaults-while-loading),
`format.ts` (`formatGBP`/`formatDate`/`formatTime` + `formatDuration`). Support
utilities: `cn.ts`, `useAsync.ts` (consistent loading/error lifecycle), `api.ts`
(typed catalogue reads + contact insert), `useDocumentTitle.ts`, `nav.ts`.

**UI kit** (`src/components/ui/`) — `Button` (primary/secondary/ghost, sizes,
`onDark`, renders button/Link/anchor), `Card` (+ `to`/`interactive`), `Input`,
`Textarea`, `Select` (labelled, hint/error, a11y-wired), `Badge`, `Spinner`,
`SectionHeading`, `Container`, and shared `LoadingState`/`ErrorState`/`EmptyState`.

**Layout** — `Header` (sticky, centred nav, amber quote CTA, mobile full-screen
teal sheet with Esc + scroll-lock), `Footer` (deep-teal chalkboard, live
`business_hours`, contact placeholders from settings, areas, Instagram, insured,
legal links), `PageHeader`, `Layout` (skip link, scroll-restoration, `<Suspense>`,
mounts `<ChatWidget/>`).

**Routing** — `App.tsx` registers every SPEC route; booking + admin modules are
`React.lazy` + `Suspense`. Public pages sit inside `Layout`; `/admin/*` renders in
its own shell outside it.

**Pages** — Home (deep-teal hero with wipe-reveal headline + ant illustration +
trust chips, DB services grid, how-it-works, areas strip, regular-clean pitch
between WipeEdge seams, Instagram teaser, final CTA), Services, ServiceDetail
(price table by band), Pricing (services × bands matrix + frequency savings
explainer + bundle callouts), Areas, About, FAQ (DB accordion grouped by
category), Contact (validated form → `contact_messages`, success/error states),
Privacy, Terms (solicitor-review scaffolds), NotFound. Stubs: booking ×2, admin
×2, and the `ChatWidget` (`return null`).

**Public assets** — `favicon.svg` (ant on a teal disc), `robots.txt` (allow all,
disallow `/admin`, sitemap), `sitemap.xml` (public routes).

Every data fetch has loading + friendly error (retry + "message us") + empty
states, so the app renders correctly against the still-populating database.

## Design decisions

- **Signature `WipeEdge`** uses a true-angle CSS gradient hard-stop, so the −3°
  seam stays a constant angle at any viewport width (clip-path percentages would
  drift with aspect ratio).
- **Hero headline "wipe reveal"** is a `background-clip: text` shine sweep, gated
  behind `prefers-reduced-motion: no-preference` with a solid-colour fallback.
- **The ant appears in the hero and (Phase 2) the stepper**, per BRAND — plus the
  404 (see deviations). Everywhere else the brand is carried by colour and type.
- **Amber discipline**: amber is reserved for the primary CTA and tiny sparkle
  highlights; trust chips, nav and icons use teal/ink.
- **Accessibility**: semantic landmarks, one `h1` per page, `font-display` headings,
  labelled forms with wired error messaging, global focus-visible rings (lightened
  on deep-teal via `.on-deep`), and a `prefers-reduced-motion` safety net plus
  per-animation guards.

## Deviations & notes for the reviewer

1. **Stack versions.** SPEC pins React 18 + router v7, honoured (React 18.3.1,
   react-router-dom 7.18.1). The environment's "latest" tags are newer (React 19,
   TypeScript 7); I used **TypeScript 5.9** (stable, well-understood by the
   toolchain) and **Vite 8** (required as a peer by `@vitejs/plugin-react@6`).
2. **`@fontsource-variable/spline-sans-mono` exists** (v5.2.8) — the fallback was
   not needed.
3. **lucide-react v1 removed brand icons** (`Instagram` no longer exported). Added
   a small hand-drawn `InstagramIcon` in `src/components/brand/icons.tsx` matching
   lucide's stroke style. All other lucide imports resolved.
4. **Build/typecheck strategy.** Single strict `tsconfig.json` (no project
   references) so both `npm run build` (`tsc --noEmit && vite build`) and
   `npx tsc --noEmit` genuinely typecheck the whole app. Kept `strict` +
   `noUnusedLocals`/`noUnusedParameters`; dropped `noUncheckedIndexedAccess` to
   avoid excessive friction across the DB-driven code.
5. **`test` script** is `vitest run --passWithNoTests` — Phase 2 owns
   `src/lib/__tests__/**`; the flag stops a zero-test run from failing meanwhile.
6. **404 uses the ant mascot**, as this task explicitly requested. That is a
   deliberate third placement beyond BRAND's "exactly two places" (hero + stepper)
   — flagging in case you'd prefer it removed.
7. **Functional colour token added.** `--color-danger` / `--color-danger-soft`
   (warm red) for form validation only — BRAND forbids purple/blue but permits
   warm tones; not used decoratively.
8. **Extra Phase-1 shared files** beyond the SPEC's named list (`cn.ts`,
   `useAsync.ts`, `api.ts`, `useDocumentTitle.ts`, `nav.ts`) — all stable shared
   infrastructure later phases can import without editing.
9. **No dev server / browser was run** (per instructions). SVGs (`AntMascot`,
   `Logo`, favicon), the hero reveal and the WipeEdge seams are constructed
   carefully but **have not been eyeballed** — worth a visual pass. They are clean
   recreations; official vector files are a client TODO.
10. **Admin pages render outside the public `Layout`** (no header/footer/chat);
    booking stubs render inside it.

## Untouched (respected hard limits)

`netlify.toml`, `.env`, `.env.example`, `supabase/**`, `docs/SPEC.md`,
`docs/BRAND.md` were not modified. No `netlify/functions` created. No git commands
run. No dependencies added beyond the specified list.

## Handover to later phases

- **Phase 2** (booking): `src/lib/pricing.ts`, `src/lib/availability.ts`,
  `src/lib/__tests__/**`, and the contents of `src/pages/booking/*`. Quote inputs
  can reuse `api.ts` reads and `format.ts`.
- **Phase 3** (admin): `src/pages/admin/*` + `src/components/admin/**`.
- **Phase 4** (chat): `netlify/functions/**` + `src/components/chat/ChatWidget.tsx`
  (already mounted in `Layout`).
- Per SPEC, shared files should not be edited after Phase 1 — raise a note instead.
