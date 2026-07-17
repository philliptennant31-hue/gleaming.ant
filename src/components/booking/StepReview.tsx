import { Pencil } from 'lucide-react'
import { formatDate, formatTime } from '../../lib/format'
import { normalisePostcode } from '../../lib/pricing'
import type { QuoteLine } from '../../lib/pricing'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { StepHeader } from './StepHeader'
import { QuoteContent, type QuoteView } from './QuotePanel'
import type { AddressState, DetailsState } from './types'

interface StepReviewProps {
  lines: QuoteLine[]
  bandLabel: string | null
  frequencyLabel: string | null
  showFrequency: boolean
  address: AddressState
  date: string
  time: string
  details: DetailsState
  onDetailsChange: (field: keyof DetailsState, value: string) => void
  errors: { name?: string; email?: string; phone?: string }
  onEdit: (step: number) => void
  quoteView: QuoteView
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: React.ReactNode
  onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <dt className="text-xs uppercase tracking-wide text-ink-soft">{label}</dt>
        <dd className="mt-0.5 text-sm text-ink">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-teal-deep hover:text-ink"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Edit
      </button>
    </div>
  )
}

export function StepReview({
  lines,
  bandLabel,
  frequencyLabel,
  showFrequency,
  address,
  date,
  time,
  details,
  onDetailsChange,
  errors,
  onEdit,
  quoteView,
}: StepReviewProps) {
  const addressLine = [address.line1, address.line2, address.city, normalisePostcode(address.postcode)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')

  return (
    <div>
      <StepHeader
        title="Nearly there, your details"
        lead="Tell us how to reach you and check everything over. We'll confirm your booking by message; there's nothing to pay now."
      />

      {/* Details form */}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Your name"
            required
            autoComplete="name"
            value={details.name}
            onChange={(e) => onDetailsChange('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="Phone"
            type="tel"
            required
            autoComplete="tel"
            value={details.phone}
            onChange={(e) => onDetailsChange('phone', e.target.value)}
            error={errors.phone}
          />
        </div>
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={details.email}
          onChange={(e) => onDetailsChange('email', e.target.value)}
          error={errors.email}
        />
        <Textarea
          label="Anything we should know?"
          hint="Optional: access notes, gate codes, a friendly dog, parking…"
          rows={3}
          value={details.notes}
          onChange={(e) => onDetailsChange('notes', e.target.value)}
        />
      </div>

      {/* Review summary */}
      <div className="mt-8 rounded-card border border-pane bg-white p-5 shadow-card">
        <h3 className="font-display text-lg font-bold text-ink">Your booking</h3>
        <dl className="mt-2 divide-y divide-pane">
          <ReviewRow
            label="Services"
            value={lines.map((l) => l.name).join(', ') || '-'}
            onEdit={() => onEdit(1)}
          />
          <ReviewRow label="Property size" value={bandLabel ?? '-'} onEdit={() => onEdit(2)} />
          {showFrequency && frequencyLabel && (
            <ReviewRow label="Frequency" value={frequencyLabel} onEdit={() => onEdit(2)} />
          )}
          <ReviewRow label="Address" value={addressLine || '-'} onEdit={() => onEdit(3)} />
          <ReviewRow
            label="Date & time"
            value={date && time ? `${formatDate(date)} at ${formatTime(time)}` : '-'}
            onEdit={() => onEdit(4)}
          />
        </dl>
      </div>

      {/* Itemised quote — shown inline on mobile (the sticky sidebar covers desktop) */}
      <div className="mt-6 rounded-card border border-pane bg-white p-5 shadow-card lg:hidden">
        <QuoteContent {...quoteView} />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        By sending this you're asking us to book the clean above. It's not charged yet. We'll be in touch to
        confirm the day and time.
      </p>
    </div>
  )
}

export default StepReview
