import { cn } from '../../lib/cn'

interface AntMascotProps {
  /** Rendered width in px. Height scales to match. */
  size?: number
  className?: string
  /** Accessible label. If omitted the mascot is decorative (aria-hidden). */
  title?: string
}

const RATIO = 112 / 132

// Artwork colours (faithful to the logo badge), deliberately literal so the
// mascot reads identically to BrandBadge on any surface. Site tokens untouched.
const NAVY = '#1E3A47'
const WHITE = '#FFFFFF'
const MID = '#4FC3C8'
const LIGHT = '#A9E3E6'

/**
 * The Gleaming Ant mascot: an ink-navy ant with a white sticker outline — round
 * abdomen, thorax, rounded-wedge head with a big cheeky white/teal eye, jointed
 * legs and round-capped antennae — pushing a small squeegee. Body parts are
 * outlined per-part (abdomen → thorax → head) so the white seams keep it
 * articulated at tiny sizes. Walks along the booking stepper and appears in the
 * hero-side artwork. Colour is internal; the `className` (e.g. `ant-bob`) still
 * drives its animation.
 */
export function AntMascot({ size = 112, className, title }: AntMascotProps) {
  const a11y = title
    ? ({ role: 'img' as const, 'aria-label': title })
    : ({ 'aria-hidden': true as const })

  return (
    <svg
      width={size}
      height={Math.round(size * RATIO)}
      viewBox="0 0 132 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {title ? <title>{title}</title> : null}

      {/* Far legs — drawn first, dimmed, for a hint of depth */}
      <g fill="none" stroke={NAVY} strokeWidth={3.5} opacity={0.45}>
        <path d="M58 60 L50 82 L46 100" />
        <path d="M72 60 L80 82 L86 100" />
      </g>

      {/* Near legs — white underlay, then navy; they emerge from behind the body */}
      <g fill="none" stroke={WHITE} strokeWidth={9}>
        <path d="M74 58 L90 64 L101 71" />
        <path d="M62 62 L58 84 L54 103" />
        <path d="M46 66 L36 86 L30 103" />
      </g>
      <g fill="none" stroke={NAVY} strokeWidth={4.5}>
        <path d="M74 58 L90 64 L101 71" />
        <path d="M62 62 L58 84 L54 103" />
        <path d="M46 66 L36 86 L30 103" />
      </g>

      {/* Antennae — behind the head, elbow bend, round caps (no knobs) */}
      <g fill="none" stroke={WHITE} strokeWidth={8}>
        <path d="M87 42 L92 29 L97 22" />
        <path d="M93 42 L103 31 L109 25" />
      </g>
      <g fill="none" stroke={NAVY} strokeWidth={4}>
        <path d="M87 42 L92 29 L97 22" />
        <path d="M93 42 L103 31 L109 25" />
      </g>

      {/* Body — outlined per part so the seams keep it articulated */}
      {/* abdomen */}
      <circle cx="40" cy="54" r="28" fill={WHITE} />
      <circle cx="40" cy="54" r="25" fill={NAVY} />
      {/* thorax, over the abdomen */}
      <circle cx="67" cy="56" r="17" fill={WHITE} />
      <circle cx="67" cy="56" r="14" fill={NAVY} />
      {/* head — rounded wedge pointing forward (right), over the thorax */}
      <path d="M82 40 L83 62 L110 50 Z" fill={WHITE} stroke={WHITE} strokeWidth={12} />
      <path d="M82 40 L83 62 L110 50 Z" fill={NAVY} stroke={NAVY} strokeWidth={6} />

      {/* Eye — big white almond, mid-aqua pupil looking ahead */}
      <ellipse cx="94" cy="50" rx="5.5" ry="7" fill={WHITE} transform="rotate(12 94 50)" />
      <circle cx="95" cy="47.5" r="3.2" fill={MID} />
      <circle cx="94" cy="46" r="1.3" fill={WHITE} />

      {/* Squeegee — carried out front */}
      <line x1="101" y1="71" x2="114" y2="90" stroke={WHITE} strokeWidth={10} />
      <line x1="101" y1="71" x2="114" y2="90" stroke={NAVY} strokeWidth={5} />
      <line x1="102" y1="97" x2="127" y2="86" stroke={WHITE} strokeWidth={15} />
      <line x1="102" y1="97" x2="127" y2="86" stroke={NAVY} strokeWidth={9} />
      <line x1="104" y1="99.5" x2="126" y2="89" stroke={LIGHT} strokeWidth={3} />
      <circle cx="101" cy="71" r="6" fill={WHITE} />
      <circle cx="101" cy="71" r="4" fill={NAVY} />
    </svg>
  )
}

export default AntMascot
