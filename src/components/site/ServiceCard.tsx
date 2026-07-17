import { ArrowRight } from 'lucide-react'
import type { Service } from '../../lib/types'
import { formatGBP } from '../../lib/format'
import { ServiceIcon } from '../brand/ServiceIcon'
import { RepeatIcon } from '../brand/icons-brand'
import { Card } from '../ui/Card'

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card to={`/services/${service.slug}`} className="group flex h-full flex-col p-6">
      <div className="flex items-start justify-between">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pane text-teal-deep">
          <ServiceIcon name={service.icon} className="h-6 w-6" />
        </span>
        {service.supports_frequency && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal/12 px-2.5 py-1 text-xs font-semibold text-teal-deep">
            <RepeatIcon className="h-3.5 w-3.5" />
            Regular option
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-xl font-bold text-ink">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{service.short_description}</p>

      <div className="mt-5 flex items-center justify-between border-t border-pane pt-4">
        <span className="text-sm text-ink-soft">
          from{' '}
          <span className="font-mono text-base font-semibold text-ink">{formatGBP(service.base_price)}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-deep transition-all group-hover:gap-2">
          View
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Card>
  )
}

export default ServiceCard
