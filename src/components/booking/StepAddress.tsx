import { Check, Info } from 'lucide-react'
import { MapPinIcon } from '../brand/icons-brand'
import { formatGBP } from '../../lib/format'
import { normalisePostcode } from '../../lib/pricing'
import type { ServiceArea } from '../../lib/types'
import { Input } from '../ui/Input'
import type { AddressState } from './types'
import { StepHeader } from './StepHeader'

interface StepAddressProps {
  address: AddressState
  onChange: (field: keyof AddressState, value: string) => void
  matchedArea: ServiceArea | null
  errors: { line1?: string; postcode?: string }
}

function AreaFeedback({ postcode, matchedArea }: { postcode: string; matchedArea: ServiceArea | null }) {
  const norm = normalisePostcode(postcode)
  if (norm === '') return null

  // A surcharge only ever applies if an area explicitly defines one (the
  // pricing engine still supports it). Live coverage is all £0, so this branch
  // is dormant unless an admin adds a surcharged area.
  if (matchedArea && matchedArea.surcharge > 0) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-lg bg-pane/50 px-3 py-2.5 text-sm text-ink">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-deep" aria-hidden="true" />
        <span>
          You're just outside our core patch, so a small {formatGBP(matchedArea.surcharge)} travel surcharge
          applies. Everything else is priced exactly the same.
        </span>
      </div>
    )
  }

  if (matchedArea) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-lg bg-teal/10 px-3 py-2.5 text-sm text-teal-deep">
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Great news, we cover <strong className="font-semibold">{matchedArea.name}</strong>.
        </span>
      </div>
    )
  }

  // No match — only reassure once enough of the postcode is entered.
  if (norm.length >= 3) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-lg bg-pane/50 px-3 py-2.5 text-sm text-ink">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-deep" aria-hidden="true" />
        <span>
          That looks like it might be outside our usual area. Send your booking through anyway and we'll
          confirm by message whether we can reach you.
        </span>
      </div>
    )
  }

  return null
}

export function StepAddress({ address, onChange, matchedArea, errors }: StepAddressProps) {
  return (
    <div>
      <StepHeader
        title="Where are we heading?"
        lead="Pop in your address so we know where to come, and check we cover your postcode."
      />

      <div className="grid gap-5">
        <Input
          label="Address line 1"
          required
          autoComplete="address-line1"
          placeholder="House number and street"
          value={address.line1}
          onChange={(e) => onChange('line1', e.target.value)}
          error={errors.line1}
        />
        <Input
          label="Address line 2"
          hint="Optional"
          autoComplete="address-line2"
          value={address.line2}
          onChange={(e) => onChange('line2', e.target.value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Town / city"
            hint="Optional"
            autoComplete="address-level2"
            value={address.city}
            onChange={(e) => onChange('city', e.target.value)}
          />
          <div>
            <Input
              label="Postcode"
              required
              autoComplete="postal-code"
              placeholder="e.g. SS14 1AA"
              value={address.postcode}
              onChange={(e) => onChange('postcode', e.target.value)}
              error={errors.postcode}
              className="uppercase placeholder:normal-case"
            />
            {!errors.postcode && <AreaFeedback postcode={address.postcode} matchedArea={matchedArea} />}
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-soft">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
        We only use your address to plan and confirm your clean.
      </p>
    </div>
  )
}

export default StepAddress
