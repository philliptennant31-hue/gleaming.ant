import { cn } from '../../lib/cn'
import { BrandBadge } from './BrandBadge'

interface LogoProps {
  className?: string
  /** Badge diameter in px. */
  badgeSize?: number
  /** Show the "Window & Exterior Cleaning" strapline under the wordmark. */
  withTagline?: boolean
  /** 'ink' for light backgrounds, 'light' for the deep-teal footer. */
  tone?: 'ink' | 'light'
}

/**
 * Full logo lockup: the ant badge (from the owner's logo) + wordmark. Use
 * `tone="light"` on the deep-teal footer. At header sizes the badge's own banner
 * text would be unreadable, so the badge renders `banners={false}` (pane +
 * squeegee + ant + sparkles) and the adjacent wordmark carries the name.
 */
export function Logo({ className, badgeSize = 40, withTagline = false, tone = 'ink' }: LogoProps) {
  const primary = tone === 'light' ? 'text-white' : 'text-ink'
  const secondary = tone === 'light' ? 'text-pane' : 'text-teal-deep'
  const tagline = tone === 'light' ? 'text-pane/80' : 'text-ink-soft'

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandBadge size={badgeSize} banners={false} title="" className="shrink-0" />
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
