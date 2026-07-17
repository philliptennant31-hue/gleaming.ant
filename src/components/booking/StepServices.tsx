import { Check, TriangleAlert } from 'lucide-react'
import { ClockIcon, RepeatIcon } from '../brand/icons-brand'
import { cn } from '../../lib/cn'
import { formatDuration, formatGBP } from '../../lib/format'
import type { Service } from '../../lib/types'
import { ServiceIcon } from '../brand/ServiceIcon'
import { StepHeader } from './StepHeader'

interface StepServicesProps {
  services: Service[]
  selectedIds: string[]
  onToggle: (id: string) => void
  error?: string
}

export function StepServices({ services, selectedIds, onToggle, error }: StepServicesProps) {
  return (
    <div>
      <StepHeader
        title="What can we clean for you?"
        lead="Pick everything you'd like doing in one visit. Bundle two or more and we'll take a discount off the total."
      />

      {error && (
        <p role="alert" className="mb-4 flex items-center gap-2 text-sm font-medium text-danger">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const selected = selectedIds.includes(service.id)
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => onToggle(service.id)}
                aria-pressed={selected}
                className={cn(
                  'relative flex h-full w-full flex-col rounded-card border bg-white p-5 text-left transition-[border-color,box-shadow]',
                  selected
                    ? 'border-teal ring-1 ring-teal shadow-card'
                    : 'border-pane hover:border-teal/50 hover:shadow-card',
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      selected ? 'bg-teal text-white' : 'bg-pane text-teal-deep',
                    )}
                  >
                    <ServiceIcon name={service.icon} className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                      selected ? 'border-teal bg-teal text-white' : 'border-ink/20 bg-white text-transparent',
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </span>

                <span className="mt-3 font-display text-lg font-bold text-ink">{service.name}</span>
                <span className="mt-1 text-sm text-ink-soft">{service.short_description}</span>

                <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                  <span className="font-mono font-semibold text-ink">from {formatGBP(service.base_price)}</span>
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  {service.supports_frequency && (
                    <span className="inline-flex items-center gap-1 text-teal-deep">
                      <RepeatIcon className="h-3.5 w-3.5" />
                      Regular option
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default StepServices
