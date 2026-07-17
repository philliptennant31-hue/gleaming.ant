import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

interface SparkleProps {
  /** Rendered size in px (width & height). */
  size?: number
  className?: string
  style?: CSSProperties
}

/**
 * A 4-point "clean glass" sparkle. Colour comes from `currentColor`, so set it
 * with a text-* utility (white on teal, amber on paper). Decorative by default.
 */
export function Sparkle({ size = 20, className, style }: SparkleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
      style={style}
    >
      <path
        d="M12 1c.55 6.2 4.8 10.45 11 11-6.2.55-10.45 4.8-11 11-.55-6.2-4.8-10.45-11-11C7.2 11.45 11.45 7.2 12 1Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default Sparkle
