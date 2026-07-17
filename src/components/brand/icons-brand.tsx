import type { ReactNode } from 'react'

/* ------------------------------------------------------------------ *
 * Gleaming Ant — bespoke sticker icons.
 *
 * Siblings of the BrandBadge ant: every mark is drawn in a shared 32×32
 * viewBox with ink-navy primary shapes, aqua glass/water accents and a
 * thin white outer rim (the sticker outline) so it reads on paper, on
 * pane-tint chips and on the deep-teal chalkboard alike. Construction is
 * uniform: navy strokes ~2.2, white underlay strokes ~+2.4, round joins,
 * gentle corner radii, the −15°-ish pane tilt where a tilt fits.
 *
 * Fixed artwork colours by design (like the badge) — these are stickers,
 * not glyph fonts, so `currentColor` does not apply. Keep them off
 * solid-navy tiles; pane tint or white is their home.
 * ------------------------------------------------------------------ */

const NAVY = '#1E3A47'
const MID = '#4FC3C8'
const LIGHT = '#A9E3E6'
const WHITE = '#FFFFFF'

/** Concave 4-point star (24×24 box) — same geometry as Sparkle/BrandBadge. */
const STAR = 'M12 1c.55 6.2 4.8 10.45 11 11-6.2.55-10.45 4.8-11 11-.55-6.2-4.8-10.45-11-11C7.2 11.45 11.45 7.2 12 1Z'

export interface BrandIconProps {
  className?: string
  /** Rendered size in px; usually set via h-/w- classes instead. */
  size?: number
}

function IconBase({ className, size = 24, children }: BrandIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Service set (star tier — service cards, detail pages, pickers)
 * ------------------------------------------------------------------ */

/** Window cleaning: the brand pane, tilted, two-tone glass, wipe shine. */
export function WindowPaneIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <g transform="rotate(-9 16 15)">
        <rect x="7.8" y="6.4" width="16.4" height="16.4" rx="2.6" fill={WHITE} stroke={WHITE} strokeWidth="3" />
        <rect x="7.8" y="6.4" width="16.4" height="16.4" rx="2.6" fill={LIGHT} />
        <path d="M8.6 8.2 L8.6 22 L22.4 22 Z" fill={MID} />
        <path d="M10.6 12.4 L19.8 8.4" stroke={WHITE} strokeWidth="1.6" opacity="0.95" />
        <path d="M16 6.4 V22.8 M7.8 14.6 H24.2" stroke={WHITE} strokeWidth="1.7" />
        <rect x="7.8" y="6.4" width="16.4" height="16.4" rx="2.6" stroke={NAVY} strokeWidth="2.2" />
      </g>
    </IconBase>
  )
}

/** Gutter clearing: water-filled channel with a leaf at the rim. */
export function GutterIcon(props: BrandIconProps) {
  const channel = 'M5.8 12 V16.6 C5.8 20 8.4 22.4 11.8 22.4 H20.2 C23.6 22.4 26.2 20 26.2 16.6 V12'
  return (
    <IconBase {...props}>
      <path d={channel} fill={WHITE} stroke={WHITE} strokeWidth="4.8" />
      <path d={channel} fill={MID} stroke={NAVY} strokeWidth="2.2" />
      <path
        d="M20.6 11.4 C21 7.6 24.2 5.9 27 6.5 C26.8 9.9 24 11.9 20.9 11.5 Z"
        fill={MID}
        stroke={WHITE}
        strokeWidth="3.6"
      />
      <path
        d="M20.6 11.4 C21 7.6 24.2 5.9 27 6.5 C26.8 9.9 24 11.9 20.9 11.5 Z"
        fill={MID}
        stroke={NAVY}
        strokeWidth="1.8"
      />
      <path d="M21.6 10.4 L24 8.2" stroke={NAVY} strokeWidth="1.4" />
      <path d="M10.4 25.2 C10.4 26.4 11 27.2 12 27.2 C13 27.2 13.6 26.4 13.6 25.2 C13.6 24.2 12 22.6 12 22.6 C12 22.6 10.4 24.2 10.4 25.2 Z" fill={MID} />
    </IconBase>
  )
}

/** Fascia & soffit: roofline over a clean fascia board. */
export function FasciaIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.8 12.6 L27.2 7.4" stroke={WHITE} strokeWidth="5.2" />
      <path d="M4.8 12.6 L27.2 7.4" stroke={NAVY} strokeWidth="2.6" />
      <rect x="7" y="15" width="18" height="5.8" rx="1.6" fill={WHITE} stroke={WHITE} strokeWidth="2.6" />
      <rect x="7" y="15" width="18" height="5.8" rx="1.6" fill={NAVY} />
      <rect x="7.8" y="18.6" width="16.4" height="1.5" rx="0.75" fill={LIGHT} />
      <path d="M9.4 24.6 H22.6" stroke={WHITE} strokeWidth="4" />
      <path d="M9.4 24.6 H22.6" stroke={MID} strokeWidth="1.8" />
    </IconBase>
  )
}

/** Conservatory: glass end-gable with glazing bars. */
export function ConservatoryIcon(props: BrandIconProps) {
  const roof = 'M6.8 22.6 L13.1 10.2 Q16 7.5 18.9 10.2 L25.2 22.6 Z'
  return (
    <IconBase {...props}>
      <path d={roof} fill={WHITE} stroke={WHITE} strokeWidth="4.6" />
      <path d={roof} fill={LIGHT} />
      <path d="M12.6 11.2 V22.6 M16 8.7 V22.6 M19.4 11.2 V22.6" stroke={WHITE} strokeWidth="1.6" />
      <path d={roof} stroke={NAVY} strokeWidth="2.2" fill="none" />
      <circle cx="16" cy="6.9" r="1.4" fill={NAVY} stroke={WHITE} strokeWidth="1.4" />
      <path d="M5.4 25.4 H26.6" stroke={WHITE} strokeWidth="4.6" />
      <path d="M5.4 25.4 H26.6" stroke={NAVY} strokeWidth="2.2" />
    </IconBase>
  )
}

/** Solar panels: tilted cell grid with a clean glint. */
export function SolarIcon(props: BrandIconProps) {
  const panel = 'M6.5 21.5 L10.2 10.5 H25.5 L21.8 21.5 Z'
  return (
    <IconBase {...props}>
      <path d={panel} fill={WHITE} stroke={WHITE} strokeWidth="4.6" />
      <path d={panel} fill={MID} />
      <path d="M15.3 10.5 L11.6 21.5 M20.4 10.5 L16.7 21.5 M8.35 16 H23.65" stroke={WHITE} strokeWidth="1.5" />
      <path d={panel} stroke={NAVY} strokeWidth="2.2" fill="none" />
      <path d="M12.4 21.8 L11.4 25.4 M19.8 21.8 L20.8 25.4" stroke={WHITE} strokeWidth="3.8" />
      <path d="M12.4 21.8 L11.4 25.4 M19.8 21.8 L20.8 25.4" stroke={NAVY} strokeWidth="1.9" />
      <g transform="translate(22.4 3.4) scale(0.27)">
        <path d={STAR} fill={WHITE} />
      </g>
    </IconBase>
  )
}

/** Pressure washing: lance spray fan onto paving. */
export function PressureWashIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.4 5.8 L12.6 11" stroke={WHITE} strokeWidth="5.4" />
      <path d="M7.4 5.8 L12.6 11" stroke={NAVY} strokeWidth="2.8" />
      <path d="M12.6 11 L14.4 12.8" stroke={NAVY} strokeWidth="4.6" />
      <path d="M15.4 13 C18 12.6 21.4 12.8 24.2 13.8" stroke={MID} strokeWidth="2.2" fill="none" />
      <path d="M15.2 14.2 C17.6 14.8 20 16.4 21.8 18.6" stroke={MID} strokeWidth="2.2" fill="none" />
      <path d="M14.2 15.2 C15.6 16.8 16.6 19 17 21.2" stroke={MID} strokeWidth="2.2" fill="none" />
      <circle cx="25.8" cy="17.4" r="1.2" fill={LIGHT} />
      <circle cx="20.6" cy="21.8" r="1.2" fill={LIGHT} />
      <path d="M6.4 25.4 H25.6" stroke={WHITE} strokeWidth="4.6" />
      <path d="M6.4 25.4 H25.6" stroke={NAVY} strokeWidth="2.2" />
      <path d="M12 25.4 V23.8 M19 25.4 V23.8" stroke={NAVY} strokeWidth="1.6" />
    </IconBase>
  )
}

/** Sparkle burst: the brand 4-point star (fallback + "clean" moments). */
export function SparkleBurstIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <g transform="translate(3.2 4.6) scale(1.02)">
        <path d={STAR} fill={WHITE} stroke={WHITE} strokeWidth="2.4" />
        <path d={STAR} fill={MID} stroke={NAVY} strokeWidth="1.7" />
      </g>
      <g transform="translate(21.6 2.4) scale(0.31)">
        <path d={STAR} fill={WHITE} stroke={WHITE} strokeWidth="7" />
        <path d={STAR} fill={NAVY} />
      </g>
    </IconBase>
  )
}

/* ------------------------------------------------------------------ *
 * Support set (quieter — steps, chips, legends, meta rows)
 * ------------------------------------------------------------------ */

/** Squeegee: blade + T-handle, tilted like the badge's. */
export function SqueegeeIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <g transform="rotate(-28 16 14)">
        <path d="M16 15 V24.6" stroke={WHITE} strokeWidth="5.6" />
        <path d="M16 15 V24.6" stroke={NAVY} strokeWidth="3" />
        <rect x="6" y="9.4" width="20" height="6" rx="1.8" fill={WHITE} stroke={WHITE} strokeWidth="2.8" />
        <rect x="6" y="9.4" width="20" height="6" rx="1.8" fill={NAVY} />
        <rect x="6.7" y="13.5" width="18.6" height="1.9" rx="0.95" fill={LIGHT} />
      </g>
      <g transform="translate(24.2 3.2) scale(0.24)">
        <path d={STAR} fill={WHITE} />
      </g>
    </IconBase>
  )
}

/** Instant quote: a friendly calculator. */
export function QuoteCalcIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <rect x="8.2" y="4.8" width="15.6" height="22.4" rx="3.2" fill={WHITE} stroke={WHITE} strokeWidth="2.6" />
      <rect x="8.2" y="4.8" width="15.6" height="22.4" rx="3.2" fill={NAVY} />
      <rect x="11.2" y="8" width="9.6" height="4.6" rx="1.2" fill={LIGHT} />
      <g fill={WHITE}>
        <circle cx="12.1" cy="16.6" r="1.3" />
        <circle cx="16" cy="16.6" r="1.3" />
        <circle cx="19.9" cy="16.6" r="1.3" />
        <circle cx="12.1" cy="20.8" r="1.3" />
        <circle cx="16" cy="20.8" r="1.3" />
        <circle cx="19.9" cy="20.8" r="1.3" />
      </g>
      <rect x="10.9" y="23.6" width="10.2" height="1.8" rx="0.9" fill={MID} />
    </IconBase>
  )
}

/** Pay after: a pound coin. */
export function PoundCoinIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="16" cy="16" r="11.6" fill={WHITE} />
      <circle cx="16" cy="16" r="10.4" fill={NAVY} />
      <circle cx="16" cy="16" r="8.3" stroke={LIGHT} strokeWidth="1.3" opacity="0.55" />
      <path d="M18.9 11.7 C18.6 9 14.4 9.2 14.3 12 L14.3 18.6" stroke={WHITE} strokeWidth="2.2" fill="none" />
      <path d="M12.2 15.9 H17.6" stroke={WHITE} strokeWidth="2.2" />
      <path d="M11.9 21 H20.3" stroke={WHITE} strokeWidth="2.2" />
    </IconBase>
  )
}

/** Reliable: calendar with a confirmed tick. */
export function CalendarTickIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 4.2 V8 M21 4.2 V8" stroke={WHITE} strokeWidth="4.6" />
      <rect x="6.5" y="6" width="19" height="20" rx="3" fill={WHITE} stroke={WHITE} strokeWidth="2.6" />
      <rect x="6.5" y="6" width="19" height="20" rx="3" fill={WHITE} stroke={NAVY} strokeWidth="2.2" />
      <path d="M6.5 12 V9 a3 3 0 0 1 3-3 h13 a3 3 0 0 1 3 3 v3 Z" fill={NAVY} />
      <path d="M11 4.2 V7.6 M21 4.2 V7.6" stroke={NAVY} strokeWidth="2.2" />
      <path d="M11.6 18.8 L14.5 21.6 L20.4 15.4" stroke={MID} strokeWidth="2.8" fill="none" />
    </IconBase>
  )
}

/** Friendly: a smiley echoing the ant's face. */
export function SmileIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="16" cy="16" r="12" fill={WHITE} />
      <circle cx="16" cy="16" r="10.8" fill={NAVY} />
      <circle cx="12.1" cy="13.4" r="1.8" fill={WHITE} />
      <circle cx="19.9" cy="13.4" r="1.8" fill={WHITE} />
      <path d="M11.3 18.4 Q16 22.8 20.7 18.4" stroke={WHITE} strokeWidth="2.4" fill="none" />
    </IconBase>
  )
}

/** Fully insured: shield with tick. */
export function ShieldTickIcon(props: BrandIconProps) {
  const shield = 'M16 3.8 L24.9 7.1 V14.6 C24.9 20.6 21.2 24.6 16 27.2 C10.8 24.6 7.1 20.6 7.1 14.6 V7.1 Z'
  return (
    <IconBase {...props}>
      <path d={shield} fill={WHITE} stroke={WHITE} strokeWidth="2.8" />
      <path d={shield} fill={NAVY} />
      <path d="M11.7 15.6 L14.7 18.6 L20.5 12.4" stroke={MID} strokeWidth="2.8" fill="none" />
    </IconBase>
  )
}

/** Map pin with an aqua centre. */
export function MapPinIcon(props: BrandIconProps) {
  const pin = 'M16 3.6 C10.9 3.6 7 7.6 7 12.4 C7 19.2 16 27.8 16 27.8 C16 27.8 25 19.2 25 12.4 C25 7.6 21.1 3.6 16 3.6 Z'
  return (
    <IconBase {...props}>
      <path d={pin} fill={WHITE} stroke={WHITE} strokeWidth="2.8" />
      <path d={pin} fill={NAVY} />
      <circle cx="16" cy="12.6" r="3.7" fill={MID} />
      <circle cx="14.7" cy="11.3" r="1" fill={WHITE} />
    </IconBase>
  )
}

/** Clock with a clean white face. */
export function ClockIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="16" cy="16" r="12" fill={WHITE} />
      <circle cx="16" cy="16" r="10.6" fill={WHITE} stroke={NAVY} strokeWidth="2.2" />
      <circle cx="16" cy="8.6" r="1" fill={MID} />
      <path d="M16 10.6 V16 L20.2 18.4" stroke={NAVY} strokeWidth="2.2" fill="none" />
      <circle cx="16" cy="16" r="1.4" fill={NAVY} />
    </IconBase>
  )
}

/** Regular rounds: circular arrows (sticker-rimmed). */
export function RepeatIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <g transform="translate(2.8 2.8) scale(1.1)" fill="none">
        <g stroke={WHITE} strokeWidth="4.3">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </g>
        <g stroke={NAVY} strokeWidth="2.1">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </g>
      </g>
    </IconBase>
  )
}

/** Calendar (pick a day). */
export function CalendarIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 4.2 V8 M21 4.2 V8" stroke={WHITE} strokeWidth="4.6" />
      <rect x="6.5" y="6" width="19" height="20" rx="3" fill={WHITE} stroke={WHITE} strokeWidth="2.6" />
      <rect x="6.5" y="6" width="19" height="20" rx="3" fill={WHITE} stroke={NAVY} strokeWidth="2.2" />
      <path d="M6.5 12 V9 a3 3 0 0 1 3-3 h13 a3 3 0 0 1 3 3 v3 Z" fill={NAVY} />
      <path d="M11 4.2 V7.6 M21 4.2 V7.6" stroke={NAVY} strokeWidth="2.2" />
      <g fill={NAVY}>
        <circle cx="11.6" cy="16.4" r="1.4" fill={MID} />
        <circle cx="16" cy="16.4" r="1.4" />
        <circle cx="20.4" cy="16.4" r="1.4" />
        <circle cx="11.6" cy="21.2" r="1.4" />
        <circle cx="16" cy="21.2" r="1.4" />
        <circle cx="20.4" cy="21.2" r="1.4" />
      </g>
    </IconBase>
  )
}

/** Bundle & save: two stacked panes. */
export function BundleIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <g transform="rotate(8 19 12)">
        <rect x="12.6" y="5.4" width="13" height="13" rx="2" fill={WHITE} stroke={WHITE} strokeWidth="2.6" />
        <rect x="12.6" y="5.4" width="13" height="13" rx="2" fill={LIGHT} stroke={NAVY} strokeWidth="2" />
      </g>
      <g transform="rotate(-8 12.6 19.4)">
        <rect x="6" y="12.8" width="13.2" height="13.2" rx="2" fill={WHITE} stroke={WHITE} strokeWidth="3" />
        <rect x="6" y="12.8" width="13.2" height="13.2" rx="2" fill={MID} />
        <path d="M12.6 12.8 V26 M6 19.4 H19.2" stroke={WHITE} strokeWidth="1.5" />
        <rect x="6" y="12.8" width="13.2" height="13.2" rx="2" stroke={NAVY} strokeWidth="2.2" fill="none" />
      </g>
    </IconBase>
  )
}

/** Percent (bundle discounts). */
export function PercentIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <path d="M9.4 23 L22.6 9" stroke={WHITE} strokeWidth="5" />
      <path d="M9.4 23 L22.6 9" stroke={NAVY} strokeWidth="2.6" />
      <circle cx="10.4" cy="10.4" r="4.7" fill={WHITE} />
      <circle cx="10.4" cy="10.4" r="3.5" fill={MID} stroke={NAVY} strokeWidth="1.9" />
      <circle cx="21.6" cy="21.6" r="4.7" fill={WHITE} />
      <circle cx="21.6" cy="21.6" r="3.5" fill={MID} stroke={NAVY} strokeWidth="1.9" />
    </IconBase>
  )
}

/** House with a tiny brand pane (property / home). */
export function HouseIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <rect x="8.4" y="13" width="15.2" height="12.6" rx="1.6" fill={WHITE} stroke={WHITE} strokeWidth="2.8" />
      <path d="M5.4 14.6 L16 6 L26.6 14.6" stroke={WHITE} strokeWidth="5.4" fill="none" />
      <rect x="8.4" y="13" width="15.2" height="12.6" rx="1.6" fill={WHITE} stroke={NAVY} strokeWidth="2.2" />
      <path d="M5.4 14.6 L16 6 L26.6 14.6" stroke={NAVY} strokeWidth="2.6" fill="none" />
      <rect x="12.6" y="16.2" width="6.8" height="6.8" rx="1" fill={MID} stroke={NAVY} strokeWidth="1.6" />
      <path d="M16 16.2 V23 M12.6 19.6 H19.4" stroke={WHITE} strokeWidth="1.3" />
    </IconBase>
  )
}

/** Chat bubble with a clean sparkle. */
export function ChatBubbleIcon(props: BrandIconProps) {
  const bubble =
    'M10 6.6 H22 a4 4 0 0 1 4 4 v6.2 a4 4 0 0 1-4 4 H16.6 L11.6 25.8 V20.8 H10 a4 4 0 0 1-4-4 V10.6 a4 4 0 0 1 4-4 Z'
  return (
    <IconBase {...props}>
      <path d={bubble} fill={WHITE} stroke={WHITE} strokeWidth="2.8" />
      <path d={bubble} fill={NAVY} />
      <g transform="translate(12.4 9.4) scale(0.3)">
        <path d={STAR} fill={WHITE} />
      </g>
    </IconBase>
  )
}

/** Phone handset (sticker-filled). */
export function PhoneIcon(props: BrandIconProps) {
  const handset =
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'
  return (
    <IconBase {...props}>
      <g transform="translate(4.2 4.2) scale(1.02)">
        <path d={handset} fill={WHITE} stroke={WHITE} strokeWidth="2.6" strokeLinejoin="round" />
        <path d={handset} fill={NAVY} />
      </g>
    </IconBase>
  )
}

/** Envelope. */
export function MailIcon(props: BrandIconProps) {
  return (
    <IconBase {...props}>
      <rect x="5.6" y="8" width="20.8" height="16" rx="3" fill={WHITE} stroke={WHITE} strokeWidth="2.8" />
      <rect x="5.6" y="8" width="20.8" height="16" rx="3" fill={NAVY} />
      <path d="M8.2 11.4 L16 17.4 L23.8 11.4" stroke={WHITE} strokeWidth="2" fill="none" />
    </IconBase>
  )
}
