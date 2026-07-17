# Phase 7 — Brand art rebuilt to match the owner's logo

Rebuilt the site's logo artwork as faithful SVG from the orchestrator's written spec
of the real (supplied) logo, then revised after the orchestrator's visual comparison
(rev 2). The old recreations were a plain teal circle badge and a loosely-drawn ant;
these are replaced with a proper sticker badge: a four-pane window leaning
anticlockwise, a squeegee wiping its top-left corner, a cheeky ant on the right
facing the squeegee, a sparkle cluster upper-left, and the two banners.

## What changed

| File | Change |
|---|---|
| `src/components/brand/BrandBadge.tsx` | **New.** The full badge as one SVG component. Props `size` (320), `className`, `title` (default label; `""` → decorative), `banners` (true). `banners` on → `viewBox 0 0 680 680`; off → tightens to `40 5 550 550` (pane + squeegee + ant + sparkles only). Artwork colours are literal hex (faithful to print), not site tokens. `useId()` (colon-sanitised) for the pane + eye clips so multiple instances don't collide. |
| `src/components/brand/Logo.tsx` | Mark swapped from the old internal circle `Badge` to `<BrandBadge banners={false} title="">`. **Export signature + props unchanged** (`className`, `badgeSize`, `withTagline`, `tone`); wordmark arrangement unchanged. |
| `src/components/brand/AntMascot.tsx` | Redrawn to the new anatomy (round abdomen, thorax, rounded-wedge head, big white/teal eye, round-capped antennae, jointed legs, small squeegee), outlined per-part so the seams keep it articulated. **Props/API, `viewBox 0 0 132 112`, `RATIO`, and root `className` (so `ant-bob` still animates) unchanged.** |
| `src/components/site/HeroArt.tsx` | Features the full badge large (`banners` on, responsive via `h-auto w-full`) with the soft glow + the existing ambient twinkling sparkles (outside the badge). Export signature unchanged. No longer renders `AntMascot` (the ant lives inside the badge now); `AntMascot` is still used by the booking `Stepper`. |
| `public/favicon.svg` | Simplified mark for 16–32px: navy rounded square, aqua pane leaning −15° w/ white outline + mullions, navy ant abdomen (lower right) + head (upper left, facing left) with a white eye dot. No text, no sparkles. |
| `scratch/logo-preview.html` | Throwaway visual check (badge 480 on chalkboard `#2E655E` textured + on paper `#F6FAF9`; badge-no-banners 40 + wordmark; badge 90; mascot 80; favicon 32). Built with `<symbol>`/`<use>` so the big badge markup lives once. |
| `.gitignore` | Appended `scratch/`. |
| `docs/PLACEHOLDERS.md` | Updated the "Official logo files" row: artwork rebuilt to match; a high-res raster export from the client's file still welcome for social/OG. |

## Rev 2 — orchestrator's visual corrections, applied

1. **Composition un-mirrored.** Pane now rotates **−15° (anticlockwise)** about
   (340,290) — top edge rising to the right; corners land at TL(132,170), TR(460,82),
   BL(220,498), BR(548,410), so the banner naturally overlaps the pane's lower-left
   and the ant (right side, facing left) overlaps the pane's right edge. Squeegee
   re-seated on the new top-left corner: blade (276×44 face + top-edge strip + light
   rubber lip, −35°) centred (180,146) covering the corner; T-handle stem
   (186,151)→(243,203), pointing down-right at the pane centre.
2. **Ant face + limbs made unmistakable.** Root cause of the "featureless blobs":
   all white underlays were drawn first, then all navy — merging the body into one
   sealed silhouette — and the legs' elbows sat inside the abdomen radius while the
   spec'd feet (y 470–505) sat entirely behind the banner (whose white border starts
   at y=450). Fixes:
   - Body now outlined **per part in sequence** (abdomen → rear leg → thorax → head),
     so white seams articulate the joints.
   - **Eye** enlarged/staged: white almond 34×46 at (400,202) tilted −20°, mid-aqua
     pupil r14 clipped to the almond, looking up-left at the squeegee, white
     highlight. Verified readable at 90px (and as a speck at the 40px lockup).
   - **Front leg** (392,285)→(318,268)→(248,210): emerges from the thorax and lands
     on the squeegee handle's end — an actual grip, selling "the ant is pushing it".
   - **Middle leg** (405,290)→(338,380)→(322,452): emerges from under the abdomen,
     foot tucking just behind the banner top.
   - **Rear leg** (432,468)→(402,430)→(378,460): drawn **over** the abdomen with its
     white outline; the knee pokes clearly proud of the banner, hip + foot tuck
     behind it.
   - **Antennae**: thick round-capped strokes with an elbow bend (no end-knobs),
     emerging from behind the head; left tip pulled to (334,88) to clear the blade's
     end corner.
3. **Sparkles** remain a cluster upper-left of the pane — none to the right — but
   moved beyond the squeegee to (116,84) 54 / (196,38) 30 / (60,160) 22, because the
   blade now occupies the spec's original coordinates (which lie along the blade's
   own −35° diagonal). Deviation to verify.
4. **Banners untouched** (confirmed correct: colours, skew, borders, type).
5. **Favicon re-oriented** to match: pane −15°, head up-left of abdomen (facing
   left). Mascot kept facing right — it walks left→right along the booking stepper;
   flagging in case the orchestrator wants it mirrored to match the badge exactly.

Confirmed correct by the orchestrator and kept exactly: pane two-tone diagonal split
+ shine crescent; `skewX(-6)`-only banner lean; pure-white keyline-free sparkles.

## Quality gates

- `npx tsc --noEmit` — **clean (exit 0)** after every change.
- Preview page — **no console errors**; visually inspected in the browser pane at
  480px (chalkboard + paper), 90px, the 40px lockup, mascot 80, favicon 32.
- No new dependencies. No git commands (the `.gitignore` line is a file edit).

## Remaining interpretations for visual sign-off

1. **Sparkle cluster coordinates** shifted as above (point 3) to clear the squeegee.
2. **Feet vs banner.** The spec's literal foot coordinates (330,470)/(420,505) lie
   fully behind the banner (white border top y=450). Feet were raised so each leg's
   lower run is visible and the tips tuck just behind the band — reading "feet just
   proud of the banner top".
3. **Eye nudged** from (400,205) to (400,202) so the almond stays on the head wedge.
4. **Banner text fit.** Both banner texts use `textLength` + `lengthAdjust` so they
   fit their bands regardless of font-load state; the sub-banner's effective size is
   ~28px (the literal 30px + 0.12em tracking overflows). Real SVG `<text>` in the
   Bricolage stack (not paths), as instructed.
5. **Palette source.** `AntMascot` and the favicon use the **artwork hex** (navy
   `#1E3A47`, etc.), a hair off the site tokens (ink `#22414F`) by design so all
   marks match the badge; site tokens themselves are untouched.

## Technique note

Every element's thick white outline is a **white underlayer** (same shape drawn ~7
units larger) with the navy shape on top at nominal size — but drawn **per part**,
in z-order, so overlapping parts cut visible white seams into their neighbours
(articulation) while each part's own outline stays sealed. Legs and antennae run
behind the body (emerging naturally) except the rear leg, which lies over the
abdomen so it stays visible above the banner.

---

## Addendum — bespoke sticker icon set (rev 3)

The public site's expressive icons (generic lucide art) were rebuilt as bespoke
mini-stickers in the badge's own visual language.

### New artwork

`src/components/brand/icons-brand.tsx` — 23 marks in a shared **32×32 viewBox**,
one construction language: ink-navy `#1E3A47` primary shapes, aqua `#4FC3C8` /
`#A9E3E6` glass-and-water accents, a ~1.2-unit **white outer rim** (white underlay,
the badge technique), navy strokes ~2.2, round joins, gentle radii, the badge's
anticlockwise tilt where a tilt fits. Fixed artwork colours (stickers, not glyph
fonts) — verified legible at 14–48px on paper, pane tint and chalkboard.

- **Service set**: `WindowPaneIcon` (tilted two-tone pane + wipe shine),
  `GutterIcon` (water-filled channel + leaf), `FasciaIcon` (roofline over board),
  `ConservatoryIcon` (glass end-gable), `SolarIcon` (tilted cell grid + glint),
  `PressureWashIcon` (lance spray fan onto paving), `SparkleBurstIcon` (brand
  4-point star pair, also the fallback).
- **Support set**: `SqueegeeIcon`, `QuoteCalcIcon`, `PoundCoinIcon`,
  `CalendarTickIcon` (Reliable), `SmileIcon` (Friendly), `ShieldTickIcon`
  (Fully insured), `MapPinIcon`, `ClockIcon`, `RepeatIcon`, `CalendarIcon`,
  `BundleIcon` (two stacked panes), `PercentIcon`, `HouseIcon` (with a mini brand
  pane), `ChatBubbleIcon` (bubble + sparkle), `PhoneIcon`, `MailIcon`.

`ServiceIcon.tsx` keeps its exact API (`{ name, className }`, DB key map, sparkle
fallback) and now resolves to the sticker set — the admin services table inherits
the new marks automatically with no admin code change.

### Where lucide was swapped (public site only)

Home (steps, hero eyebrow pin, area chips, empty state), About (values trio),
TrustChips, Contact (phone/email/WhatsApp method tiles), Services + Areas + FAQ
(tiles/empty states), Pricing (frequency, bundle, percent), ServiceDetail (badge
chips + hero tile), ServiceCard (regular chip), ComingSoon (fallback), booking
QuotePanel / StepAddress / StepProperty / StepDateTime / StepServices,
BookingConfirmedPage (meta rows). Tiles that were `bg-teal-deep text-white`
(Home steps, About values, ServiceDetail hero) became `bg-pane` so the navy
stickers sit on their home surface.

### Deliberately left alone

Functional glyphs (arrows, chevrons, menu/close, form-state ticks/crosses,
spinner, `Info` callouts, `Pencil` edit, `Copy`), button-control icons (e.g.
"Message us" `MessageCircle`, NotFound's `Home`), `ScrollText` legal notices on
Privacy/Terms (amber warning context), `InstagramIcon` (social glyph), everything
under `src/pages/admin` + `src/components/admin`, the chat widget, and
`src/components/layout/**` (Header/Footer icons are outside this task's ownership
— flag if the footer's contact icons should follow in a later pass).

### Gates

`npx tsc --noEmit` clean; `npx vitest run` 83/83 green; preview page
(`scratch/logo-preview.html`, "Sticker icon set" cards on paper + chalkboard +
size ramp) renders with no console errors. No new dependencies.
