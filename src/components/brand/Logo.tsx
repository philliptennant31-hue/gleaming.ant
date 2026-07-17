import { cn } from '../../lib/cn'

interface LogoProps {
  className?: string
  /** Badge diameter in px. */
  badgeSize?: number
  /** Show the "Window & Exterior Cleaning" strapline under the wordmark. */
  withTagline?: boolean
  /** 'ink' for light backgrounds, 'light' for the deep-teal footer. */
  tone?: 'ink' | 'light'
}

/** The circular ant-badge, rebuilt from the logo as clean SVG. */
function Badge({ size }: { size: number }) {
  const ink = 'var(--color-ink)'
  const white = 'var(--color-white)'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="24" cy="24" r="23" fill="var(--color-teal)" stroke="var(--color-teal-deep)" strokeWidth="1.5" />

      {/* Tilted window pane with a squeegee shine */}
      <g transform="rotate(-3 24 24)">
        <rect x="11" y="12" width="26" height="24" rx="3.5" fill="var(--color-pane)" stroke={white} strokeWidth="2" />
        <path d="M15 32 L33 16" stroke={white} strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
      </g>

      {/* Minimal ant at work on the pane */}
      <g>
        <ellipse cx="19.5" cy="30.5" rx="4.4" ry="3.4" fill={ink} />
        <circle cx="24" cy="29.4" r="2.2" fill={ink} />
        <circle cx="27.4" cy="28.4" r="2.7" fill={ink} />
        <path d="M28.5 26.4 Q30 23.5 31.8 22.6" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="31.9" cy="22.4" r="0.9" fill={ink} />
        {/* squeegee */}
        <path d="M29.5 29 L33.6 33" stroke="var(--color-teal-deep)" strokeWidth="1.8" strokeLinecap="round" />
        <g transform="rotate(-3 34 33.6)">
          <rect x="31.2" y="32.3" width="6.4" height="2.4" rx="1.2" fill={ink} />
        </g>
      </g>

      {/* Sparkle */}
      <path
        d="M35 11c.2 2.3 1.8 3.9 4 4-2.2.2-3.8 1.8-4 4-.2-2.2-1.8-3.8-4-4 2.2-.1 3.8-1.7 4-4Z"
        fill={white}
      />
    </svg>
  )
}

/**
 * Full logo lockup: ant badge + wordmark. Use `tone="light"` on the deep-teal
 * footer. The ornate original (banner artwork, official vector files) is a
 * client TODO — see docs/PLACEHOLDERS.md.
 */
export function Logo({ className, badgeSize = 40, withTagline = false, tone = 'ink' }: LogoProps) {
  const primary = tone === 'light' ? 'text-white' : 'text-ink'
  const secondary = tone === 'light' ? 'text-pane' : 'text-teal-deep'
  const tagline = tone === 'light' ? 'text-pane/80' : 'text-ink-soft'

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Badge size={badgeSize} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.16rem] font-extrabold tracking-tight">
          <span className={primary}>Gleaming</span>{' '}
          <span className={secondary}>Ant</span>
        </span>
        {withTagline && (
          <span className={cn('mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.2em]', tagline)}>
            Window &amp; Exterior Cleaning
          </span>
        )}
      </span>
    </span>
  )
}

export default Logo
