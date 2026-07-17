import { CalendarCheck, ShieldCheck, Smile } from 'lucide-react'
import { cn } from '../../lib/cn'

const CHIPS = [
  { icon: CalendarCheck, label: 'Reliable' },
  { icon: Smile, label: 'Friendly' },
  { icon: ShieldCheck, label: 'Fully insured' },
]

interface TrustChipsProps {
  tone?: 'ink' | 'light'
  className?: string
}

/** The client's own bio positioning, rendered as pane-tint pills with teal icons. */
export function TrustChips({ tone = 'ink', className }: TrustChipsProps) {
  return (
    <ul className={cn('flex flex-wrap gap-2.5', className)}>
      {CHIPS.map(({ icon: Icon, label }) => (
        <li key={label}>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold',
              tone === 'light' ? 'bg-white/10 text-white' : 'bg-pane text-teal-deep',
            )}
          >
            <Icon
              className={cn('h-4 w-4', tone === 'light' ? 'text-teal' : 'text-teal-deep')}
              aria-hidden="true"
            />
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default TrustChips
