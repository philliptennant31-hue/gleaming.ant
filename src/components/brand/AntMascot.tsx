import { cn } from '../../lib/cn'

interface AntMascotProps {
  /** Rendered width in px. Height scales to match. */
  size?: number
  className?: string
  /** Accessible label. If omitted the mascot is decorative (aria-hidden). */
  title?: string
}

const RATIO = 112 / 132

/**
 * The Gleaming Ant mascot: an ink-bodied ant with a white outline and a round
 * abdomen, pushing a squeegee. Rebuilt from the logo. Designed to sit on a light
 * surface (the pane window in the hero, the booking stepper in Phase 2).
 */
export function AntMascot({ size = 112, className, title }: AntMascotProps) {
  const a11y = title
    ? ({ role: 'img' as const, 'aria-label': title })
    : ({ 'aria-hidden': true as const })

  const ink = 'var(--color-ink)'
  const white = 'var(--color-white)'

  return (
    <svg
      width={size}
      height={Math.round(size * RATIO)}
      viewBox="0 0 132 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      {...a11y}
    >
      {title ? <title>{title}</title> : null}

      {/* Far legs — drawn first, dimmed, for a hint of depth */}
      <g stroke={ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.45}>
        <path d="M62 64 L53 80 L47 96" />
        <path d="M74 66 L78 82 L84 96" />
      </g>

      {/* Near legs */}
      <g stroke={ink} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M58 63 L47 79 L40 95" />
        <path d="M72 65 L70 81 L63 95" />
      </g>

      {/* Body: abdomen, petiole, thorax */}
      <g stroke={white} strokeWidth={3}>
        <ellipse cx="42" cy="54" rx="26" ry="22" fill={ink} />
        <circle cx="65" cy="57" r="5" fill={ink} />
        <ellipse cx="77" cy="55" rx="13" ry="12" fill={ink} />
      </g>

      {/* Abdomen sheen */}
      <ellipse cx="33" cy="44" rx="9" ry="6" fill={white} opacity={0.16} transform="rotate(-24 33 44)" />

      {/* Head */}
      <circle cx="98" cy="50" r="13" fill={ink} stroke={white} strokeWidth={3} />

      {/* Antennae */}
      <g stroke={ink} strokeWidth={2.4} strokeLinecap="round" fill="none">
        <path d="M93 40 Q100 30 107 24" />
        <path d="M90 42 Q93 30 99 21" />
      </g>
      <circle cx="107" cy="24" r="2.1" fill={ink} />
      <circle cx="99" cy="21" r="2.1" fill={ink} />

      {/* Eye */}
      <ellipse cx="102" cy="47" rx="3.6" ry="4.2" fill={white} />
      <circle cx="103" cy="48" r="1.8" fill={ink} />
      <circle cx="101" cy="46" r="0.9" fill={white} />

      {/* Squeegee handle */}
      <path d="M104 61 L121 87" stroke="var(--color-teal-deep)" strokeWidth={4.6} strokeLinecap="round" />
      <path d="M105.6 61.6 L122 86" stroke={white} strokeWidth={1} strokeLinecap="round" opacity={0.5} />

      {/* Squeegee blade — tilted to the brand −3° */}
      <g transform="rotate(-3 118 90)">
        <rect x="105" y="87" width="26" height="6.2" rx="3.1" fill={ink} />
        <rect x="106" y="86.2" width="24" height="2.3" rx="1.15" fill="var(--color-pane)" />
      </g>

      {/* Front leg + "hand" gripping the handle */}
      <path d="M82 60 L95 64 L104 61" stroke={ink} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="104" cy="61" r="3.4" fill={ink} />
    </svg>
  )
}

export default AntMascot
