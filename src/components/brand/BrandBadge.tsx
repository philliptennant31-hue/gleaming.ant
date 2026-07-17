import { useId } from 'react'
import { cn } from '../../lib/cn'

/* ------------------------------------------------------------------ *
 * Gleaming Ant — the sticker badge, rebuilt to match the owner's logo.
 *
 * Composition (verified against the real logo): a four-pane window leaning
 * anticlockwise (top edge rising to the right), a squeegee wiping its
 * top-left corner (blade sloping upper-right → lower-left, T-handle toward
 * the pane centre), a cheeky ant on the right overlapping the pane edge and
 * facing left toward the squeegee, three sparkles clustered upper-left, and
 * two banners (GLEAMING ANT / WINDOW & EXTERIOR CLEANING).
 *
 * Every element carries a thick white outline. Body parts are outlined
 * per-part (abdomen → rear leg → thorax → head) so the white seams keep the
 * ant articulated rather than merging into one blob.
 *
 * These are *artwork* colours (faithful to the printed logo), deliberately
 * literal rather than the site design tokens — the badge must look the same
 * on any surface. Site tokens (docs/BRAND.md) are untouched.
 * ------------------------------------------------------------------ */

const NAVY = '#1E3A47'
const MID = '#4FC3C8'
const LIGHT = '#A9E3E6'
const XLIGHT = '#CDF0F1'
const WHITE = '#FFFFFF'
const ORANGE = '#F49B33'

const DISPLAY = "'Bricolage Grotesque Variable', 'Figtree Variable', ui-sans-serif, sans-serif"

/** Concave 4-point star — same geometry as the Sparkle component (24×24 box). */
const STAR = 'M12 1c.55 6.2 4.8 10.45 11 11-6.2.55-10.45 4.8-11 11-.55-6.2-4.8-10.45-11-11C7.2 11.45 11.45 7.2 12 1Z'

function Star({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const scale = s / 24
  return (
    <g transform={`translate(${cx - s / 2} ${cy - s / 2}) scale(${scale})`}>
      <path d={STAR} fill={WHITE} />
    </g>
  )
}

interface BrandBadgeProps {
  /** Rendered width & height in px. */
  size?: number
  className?: string
  /** Accessible title. Pass an empty string to make the badge decorative. */
  title?: string
  /** Show the GLEAMING ANT / WINDOW & EXTERIOR CLEANING banners. */
  banners?: boolean
}

/**
 * The full Gleaming Ant badge as one SVG. Renders crisply from ~90px to ~560px.
 * With `banners={false}` the two text bands are dropped and the viewBox tightens
 * to the pane + squeegee + ant + sparkles — for tiny lockups (see Logo) where the
 * banner text would be unreadable and the adjacent wordmark carries the name.
 */
export function BrandBadge({
  size = 320,
  className,
  title = 'Gleaming Ant. Window and exterior cleaning.',
  banners = true,
}: BrandBadgeProps) {
  const uid = useId().replace(/:/g, '')
  const paneClip = `ga-pane-${uid}`
  const eyeClip = `ga-eye-${uid}`
  const decorative = !title
  const a11y = decorative
    ? ({ 'aria-hidden': true as const })
    : ({ role: 'img' as const, 'aria-label': title })

  // Tighter frame when the banners are hidden so the mark fills the box.
  const viewBox = banners ? '0 0 680 680' : '40 5 550 550'

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      {...a11y}
    >
      {!decorative ? <title>{title}</title> : null}

      <defs>
        <clipPath id={paneClip}>
          <rect x="170" y="120" width="340" height="340" rx="36" />
        </clipPath>
        <clipPath id={eyeClip}>
          <ellipse cx="400" cy="202" rx="17" ry="23" transform="rotate(-20 400 202)" />
        </clipPath>
      </defs>

      {/* 1 — WINDOW PANE (leaning anticlockwise: top edge rises to the right) */}
      <g transform="rotate(-15 340 290)">
        <g clipPath={`url(#${paneClip})`}>
          {/* upper-right glass */}
          <rect x="170" y="120" width="340" height="340" fill={LIGHT} />
          {/* lower-left glass (below the top-left → bottom-right diagonal) */}
          <path d="M170 120 L170 460 L510 460 Z" fill={MID} />
          {/* broad shine crescent across the upper half */}
          <path
            d="M198 214 C 284 158 402 156 488 196 C 470 214 398 200 300 212 C 254 218 224 221 198 214 Z"
            fill={XLIGHT}
            opacity="0.9"
          />
          {/* mullions → four panes */}
          <rect x="335" y="120" width="10" height="340" fill={WHITE} />
          <rect x="170" y="285" width="340" height="10" fill={WHITE} />
        </g>
        {/* white frame */}
        <rect x="170" y="120" width="340" height="340" rx="36" fill="none" stroke={WHITE} strokeWidth="14" />
      </g>

      {/* 2 — SQUEEGEE across the pane's top-left corner
             (blade slopes upper-right → lower-left; T-handle toward pane centre) */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* handle stem first — its joint hides under the blade */}
        <line x1="186" y1="151" x2="243" y2="203" stroke={WHITE} strokeWidth="40" />
        <line x1="186" y1="151" x2="243" y2="203" stroke={NAVY} strokeWidth="26" />
        {/* blade with simple 3D depth: top-edge strip + face + light rubber lip */}
        <g transform="translate(180 146) rotate(-35)">
          <polygon
            points="-138,-10 -124,-22 152,-22 138,-10 138,22 -138,22"
            fill={WHITE}
            stroke={WHITE}
            strokeWidth="14"
          />
          <polygon points="-138,-10 -124,-22 152,-22 138,-10 138,22 -138,22" fill={NAVY} />
          <line x1="-138" y1="-10" x2="138" y2="-10" stroke={WHITE} strokeWidth="3.5" />
          <rect x="-138" y="13" width="276" height="9" fill={LIGHT} />
        </g>
      </g>

      {/* 3 — ANT (right side, facing left toward the squeegee, overlapping the pane edge) */}
      <g strokeLinejoin="round" strokeLinecap="round">
        {/* front + middle legs — behind the body so they emerge naturally.
            The front leg reaches from the thorax to grip the squeegee handle. */}
        <g fill="none" stroke={WHITE} strokeWidth="28">
          <path d="M392 285 L318 268 L248 210" />
          <path d="M405 290 L338 380 L322 452" />
        </g>
        <g fill="none" stroke={NAVY} strokeWidth="14">
          <path d="M392 285 L318 268 L248 210" />
          <path d="M405 290 L338 380 L322 452" />
        </g>

        {/* antennae — behind the head, rising with an elbow bend, round caps */}
        <g fill="none" stroke={WHITE} strokeWidth="26">
          <path d="M400 160 L356 114 L334 88" />
          <path d="M410 158 L441 116 L455 95" />
        </g>
        <g fill="none" stroke={NAVY} strokeWidth="12">
          <path d="M400 160 L356 114 L334 88" />
          <path d="M410 158 L441 116 L455 95" />
        </g>

        {/* abdomen */}
        <circle cx="468" cy="372" r="119" fill={WHITE} />
        <circle cx="468" cy="372" r="112" fill={NAVY} />

        {/* rear leg — over the abdomen; its knee sits proud of the banner,
            hip and foot tuck behind it */}
        <path d="M432 468 L402 430 L378 460" fill="none" stroke={WHITE} strokeWidth="28" />
        <path d="M432 468 L402 430 L378 460" fill="none" stroke={NAVY} strokeWidth="14" />

        {/* thorax — outlined over the abdomen (visible seam) */}
        <rect x="373" y="232" width="84" height="72" rx="31" fill={WHITE} />
        <rect x="380" y="239" width="70" height="58" rx="24" fill={NAVY} />

        {/* head — rounded wedge pointing down-left, outlined over the thorax */}
        <path d="M405 154 L433 212 L339 234 Z" fill={WHITE} stroke={WHITE} strokeWidth="28" />
        <path d="M405 154 L433 212 L339 234 Z" fill={NAVY} stroke={NAVY} strokeWidth="14" />

        {/* eye — large white almond, mid-aqua pupil looking up-left at the squeegee */}
        <ellipse cx="400" cy="202" rx="17" ry="23" fill={WHITE} transform="rotate(-20 400 202)" />
        <g clipPath={`url(#${eyeClip})`}>
          <circle cx="393" cy="196" r="14" fill={MID} />
          <circle cx="388" cy="190" r="4.5" fill={WHITE} />
        </g>
      </g>

      {/* 4 — SPARKLES, clustered upper-left of the pane, beyond the squeegee */}
      <Star cx={116} cy={84} s={54} />
      <Star cx={196} cy={38} s={30} />
      <Star cx={60} cy={160} s={22} />

      {banners ? (
        <>
          {/* 5 — MAIN BANNER (italic lean) */}
          <g transform="translate(340 508) skewX(-6) translate(-340 -508)">
            <rect x="77" y="450" width="526" height="116" rx="26" fill={WHITE} />
            <rect x="87" y="460" width="506" height="96" rx="18" fill={NAVY} />
            <rect x="95" y="468" width="490" height="80" rx="12" fill={ORANGE} />
            <text
              x="340"
              y="509"
              textAnchor="middle"
              dominantBaseline="central"
              textLength="452"
              lengthAdjust="spacingAndGlyphs"
              fill={WHITE}
              stroke={NAVY}
              strokeWidth="2.5"
              strokeLinejoin="round"
              style={{ fontFamily: DISPLAY, fontWeight: 800, fontStyle: 'italic', fontSize: '62px', paintOrder: 'stroke' }}
            >
              GLEAMING ANT
            </text>
          </g>

          {/* 6 — SUB-BANNER (straight) */}
          <g>
            <rect x="115" y="541" width="450" height="80" rx="24" fill={WHITE} />
            <rect x="123" y="549" width="434" height="64" rx="18" fill={NAVY} />
            <rect x="130" y="556" width="420" height="50" rx="12" fill={WHITE} />
            <text
              x="340"
              y="582"
              textAnchor="middle"
              dominantBaseline="central"
              textLength="404"
              lengthAdjust="spacingAndGlyphs"
              fill={NAVY}
              style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '28px' }}
            >
              WINDOW &amp; EXTERIOR CLEANING
            </text>
          </g>
        </>
      ) : null}
    </svg>
  )
}

export default BrandBadge
