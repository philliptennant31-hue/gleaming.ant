import { cn } from '../../lib/cn'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

/**
 * Loading spinner. Colour follows `currentColor`. Pair it with visible text so
 * the state still reads for reduced-motion users (the spin is stilled for them).
 */
export function Spinner({ size = 22, className, label = 'Loading' }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default Spinner
