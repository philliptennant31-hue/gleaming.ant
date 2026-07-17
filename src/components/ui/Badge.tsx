import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'pane' | 'teal' | 'amber' | 'ink' | 'neutral' | 'success' | 'danger'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  size?: 'sm' | 'md'
  leftIcon?: ReactNode
  className?: string
}

const tones: Record<BadgeTone, string> = {
  pane: 'bg-pane text-teal-deep',
  teal: 'bg-teal/15 text-teal-deep',
  amber: 'bg-amber/15 text-amber-deep',
  ink: 'bg-ink text-white',
  neutral: 'bg-ink/8 text-ink-soft',
  success: 'bg-teal/15 text-teal-deep',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ children, tone = 'pane', size = 'md', leftIcon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        tones[tone],
        className,
      )}
    >
      {leftIcon}
      {children}
    </span>
  )
}

export default Badge
