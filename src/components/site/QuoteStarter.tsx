import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchActiveServices, fetchPropertyBands } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { cn } from '../../lib/cn'
import type { PropertyBand, Service } from '../../lib/types'
import { Sparkle } from '../brand/Sparkle'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

interface QuoteStarterCatalogue {
  services: Service[]
  bands: PropertyBand[]
}

export interface QuoteStarterProps {
  /** Card heading — a fast, upfront price promise. */
  title?: string
  /** One supporting line under the title, in the site's own voice. */
  supportLine?: string
  /** Label for the size/property select (e.g. "Your property"). */
  sizeLabel?: string
  /**
   * Compact hero presentation (the default): tighter padding, a smaller title
   * and reduced field gaps so the whole card stays short enough to overlay the
   * hero photo and sit inside the fold. Pass `compact={false}` for the roomy
   * standalone card.
   */
  compact?: boolean
  className?: string
}

const DEFAULT_TITLE = 'Your price in 60 seconds'
const DEFAULT_SUPPORT = 'Two quick questions and you have a fair, upfront price. No calls, no waiting.'
const DEFAULT_SIZE_LABEL = 'Your property'

const cardBase = 'rounded-card border border-pane bg-white shadow-lift'

/**
 * Build the booking-prefill URL from the starter's fields, using exactly the
 * param names BookingPage parses (`services`, `band`, `postcode`). Empty
 * optional fields are omitted. Exported for unit testing; mirrors
 * ChatWidget.buildQuoteUrl so the card and Sparkle's chat handoff land the
 * visitor on the booking wizard prefilled in exactly the same way.
 */
export function buildQuoteStarterUrl(
  serviceSlug: string,
  bandCode: string,
  postcode: string,
): string {
  const slug = serviceSlug.trim()
  if (!slug) return '/booking'
  const params = new URLSearchParams()
  params.set('services', slug)
  const band = bandCode.trim()
  if (band) params.set('band', band)
  const pc = postcode.trim()
  if (pc) params.set('postcode', pc)
  return `/booking?${params.toString()}`
}

/**
 * A compact, reusable "instant quote" starter card. Reads the live catalogue
 * (services + property bands) through the api layer — the same source the
 * booking wizard uses — and hands off to /booking with the fields prefilled,
 * matching Sparkle's chat handoff exactly. It knows no trade specifics beyond
 * its props (title, supportLine, sizeLabel).
 */
export function QuoteStarter({
  title,
  supportLine,
  sizeLabel,
  compact = true,
  className,
}: QuoteStarterProps) {
  const navigate = useNavigate()
  const { data, loading, error } = useAsync<QuoteStarterCatalogue>(async () => {
    const [services, bands] = await Promise.all([fetchActiveServices(), fetchPropertyBands()])
    return { services, bands }
  }, [])

  const [serviceSlug, setServiceSlug] = useState('')
  const [bandCode, setBandCode] = useState('')
  const [postcode, setPostcode] = useState('')

  const pad = compact ? 'p-5' : 'p-6 sm:p-7'

  // Loading: hold the hero's shape with a placeholder card the same size.
  if (loading) {
    return (
      <div
        className={cn(
          cardBase,
          'flex items-center justify-center',
          compact ? 'px-5 py-10' : 'px-7 py-16',
          className,
        )}
      >
        <Spinner size={26} className="text-teal-deep" label="Loading the quote form…" />
      </div>
    )
  }

  // Graceful: on error or a genuinely empty catalogue the whole card hides, so
  // the hero never shows a broken or empty form.
  if (error || !data || data.services.length === 0) return null

  const { services, bands } = data
  const heading = title ?? DEFAULT_TITLE
  const support = supportLine ?? DEFAULT_SUPPORT
  const sizeSelectLabel = sizeLabel ?? DEFAULT_SIZE_LABEL
  const canContinue = serviceSlug.trim().length > 0

  const handleStart = () => {
    if (!canContinue) return
    navigate(buildQuoteStarterUrl(serviceSlug, bandCode, postcode))
  }

  return (
    <div className={cn(cardBase, pad, className)}>
      <div className="flex items-center gap-2">
        <Sparkle size={compact ? 16 : 18} className="text-teal-deep" />
        <p className={cn('font-display font-bold text-ink', compact ? 'text-base' : 'text-lg')}>
          {heading}
        </p>
      </div>
      <p className={cn('text-sm leading-relaxed text-ink-soft', compact ? 'mt-1' : 'mt-1.5')}>
        {support}
      </p>

      <div className={cn('flex flex-col', compact ? 'mt-4 gap-3' : 'mt-5 gap-4')}>
        <Select
          label="Service"
          value={serviceSlug}
          onChange={(e) => setServiceSlug(e.target.value)}
        >
          <option value="">Choose a service…</option>
          {services.map((service) => (
            <option key={service.id} value={service.slug}>
              {service.name}
            </option>
          ))}
        </Select>

        {bands.length > 0 && (
          <Select
            label={sizeSelectLabel}
            value={bandCode}
            onChange={(e) => setBandCode(e.target.value)}
          >
            <option value="">Select…</option>
            {bands.map((band) => (
              <option key={band.code} value={band.code}>
                {band.label}
              </option>
            ))}
          </Select>
        )}

        <Input
          label={compact ? 'Postcode (optional)' : 'Postcode'}
          hint={compact ? undefined : 'Optional — so we can check we cover you.'}
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          inputMode="text"
          autoComplete="postal-code"
          autoCapitalize="characters"
          maxLength={8}
          placeholder="e.g. SS14 1AB"
        />

        <Button
          onClick={handleStart}
          disabled={!canContinue}
          fullWidth
          size="lg"
          rightIcon={<ArrowRight className="h-5 w-5" />}
        >
          Get my price
        </Button>
      </div>
    </div>
  )
}

export default QuoteStarter
