import { CalendarTickIcon, ShieldTickIcon, SmileIcon } from '../brand/icons-brand'
import { cn } from '../../lib/cn'

const CHIPS = [
  { icon: CalendarTickIcon, label: 'Reliable' },
  { icon: SmileIcon, label: 'Friendly' },
  { icon: ShieldTickIcon, label: 'Fully insured' },
]

interface TrustChipsProps {
  tone?: 'ink' | 'light'
  className?: string
}

/** The client's own bio positioning, rendered as pills with sticker icons. */
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
            <Icon className="h-4 w-4" />
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default TrustChips
