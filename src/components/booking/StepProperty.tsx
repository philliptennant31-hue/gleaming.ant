import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Frequency, PropertyBand } from '../../lib/types'
import { StepHeader } from './StepHeader'

interface StepPropertyProps {
  bands: PropertyBand[]
  bandCode: string
  onBandChange: (code: string) => void
  frequencies: Frequency[]
  frequencyCode: string
  onFrequencyChange: (code: string) => void
  /** True when at least one selected service supports a regular schedule. */
  showFrequency: boolean
  error?: string
}

/** A radio option styled as a selectable card (native input for full a11y). */
function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  subtitle,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  title: string
  subtitle?: string
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-card border bg-white p-4 transition-[border-color,box-shadow] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber has-[:focus-visible]:ring-offset-2',
        checked ? 'border-teal ring-1 ring-teal' : 'border-pane hover:border-teal/50',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          checked ? 'border-teal' : 'border-ink/25',
        )}
        aria-hidden="true"
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-teal" />}
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        {subtitle && <span className="block text-sm text-ink-soft">{subtitle}</span>}
      </span>
    </label>
  )
}

export function StepProperty({
  bands,
  bandCode,
  onBandChange,
  frequencies,
  frequencyCode,
  onFrequencyChange,
  showFrequency,
  error,
}: StepPropertyProps) {
  return (
    <div>
      <StepHeader
        title="Tell us about your property"
        lead="Prices are set by the size of your home, so we can give you an exact quote."
      />

      {error && (
        <p role="alert" className="mb-4 flex items-center gap-2 text-sm font-medium text-danger">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Home className="h-4 w-4 text-teal-deep" aria-hidden="true" />
          Property size
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {bands.map((band) => (
            <RadioCard
              key={band.code}
              name="property-band"
              value={band.code}
              checked={bandCode === band.code}
              onChange={onBandChange}
              title={band.label}
            />
          ))}
        </div>
      </fieldset>

      {showFrequency ? (
        <fieldset className="mt-8">
          <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <RefreshCw className="h-4 w-4 text-teal-deep" aria-hidden="true" />
            How often?
          </legend>
          <p className="mb-3 text-sm text-ink-soft">
            A regular round keeps things consistently spotless and costs less per visit than a one-off. You can
            change or cancel any time, and we'll confirm the schedule with you.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {frequencies.map((freq) => (
              <RadioCard
                key={freq.code}
                name="frequency"
                value={freq.code}
                checked={frequencyCode === freq.code}
                onChange={onFrequencyChange}
                title={freq.label}
              />
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="mt-8 rounded-card border border-pane bg-pane/25 px-4 py-3 text-sm text-ink-soft">
          The services you've chosen are priced as a one-off visit. No regular schedule needed.
        </p>
      )}
    </div>
  )
}

export default StepProperty
