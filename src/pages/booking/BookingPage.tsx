import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from 'lucide-react'
import {
  fetchActiveServices,
  fetchBundleDiscounts,
  fetchBusinessHours,
  fetchFrequencies,
  fetchPropertyBands,
  fetchServiceAreas,
  fetchServicePrices,
} from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { useSiteSettings } from '../../lib/settings'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { computeQuote, matchArea } from '../../lib/pricing'
import type { BookingItem } from '../../lib/types'
import { Container } from '../../components/ui/Container'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { LoadingState, ErrorState } from '../../components/ui/states'
import { Stepper } from '../../components/booking/Stepper'
import { QuotePanel, type QuoteView } from '../../components/booking/QuotePanel'
import { StepServices } from '../../components/booking/StepServices'
import { StepProperty } from '../../components/booking/StepProperty'
import { StepAddress } from '../../components/booking/StepAddress'
import { StepDateTime } from '../../components/booking/StepDateTime'
import { StepReview } from '../../components/booking/StepReview'
import { insertBooking, type BookingInsert } from '../../components/booking/submit'
import {
  STEP_LABELS,
  TOTAL_STEPS,
  type AddressState,
  type CatalogueData,
  type DetailsState,
} from '../../components/booking/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY_ADDRESS: AddressState = { line1: '', line2: '', city: '', postcode: '' }
const EMPTY_DETAILS: DetailsState = { name: '', email: '', phone: '', notes: '' }

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' })
}

export default function BookingPage() {
  useDocumentTitle('Get an instant quote | Gleaming Ant')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings } = useSiteSettings()

  const catalogue = useAsync<CatalogueData>(async () => {
    const [services, bands, prices, frequencies, bundles, areas, hours] = await Promise.all([
      fetchActiveServices(),
      fetchPropertyBands(),
      fetchServicePrices(),
      fetchFrequencies(),
      fetchBundleDiscounts(),
      fetchServiceAreas(),
      fetchBusinessHours(),
    ])
    return { services, bands, prices, frequencies, bundles, areas, hours }
  }, [])

  // ---- Wizard state ----
  const [step, setStep] = useState(1)
  const [furthest, setFurthest] = useState(1)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [bandCode, setBandCode] = useState('')
  const [frequencyCode, setFrequencyCode] = useState('every_4_weeks')
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [details, setDetails] = useState<DetailsState>(EMPTY_DETAILS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  // ---- URL-param prefill (Sparkle handoff + entry-point deep links) ----
  // Applied exactly once, after the catalogue loads. The URL is left intact so
  // links stay shareable. Unknown param values are ignored silently.
  const prefillApplied = useRef(false)
  useEffect(() => {
    if (prefillApplied.current) return
    const cat = catalogue.data
    if (!cat) return
    prefillApplied.current = true

    const bySlug = new Map(cat.services.map((s) => [s.slug, s]))
    const ids: string[] = []
    const seen = new Set<string>()
    for (const slug of (searchParams.get('services') ?? '').split(',')) {
      const service = bySlug.get(slug.trim())
      if (service && !seen.has(service.id)) {
        seen.add(service.id)
        ids.push(service.id)
      }
    }
    // Zero valid services -> behave exactly as a fresh load (step 1, nothing set).
    if (ids.length === 0) return

    setSelectedServiceIds(ids)

    const bandParam = searchParams.get('band')
    const validBand = bandParam && cat.bands.some((b) => b.code === bandParam) ? bandParam : ''
    if (validBand) setBandCode(validBand)

    const frequencyParam = searchParams.get('frequency')
    if (frequencyParam && cat.frequencies.some((f) => f.code === frequencyParam)) {
      setFrequencyCode(frequencyParam)
    }

    const postcodeParam = searchParams.get('postcode')?.trim()
    if (postcodeParam) setAddress((a) => ({ ...a, postcode: postcodeParam }))

    // Services only -> step 2 (Property). Services + a valid band -> step 3
    // (Address). Never deeper: address always needs manual input.
    const startStep = validBand ? 3 : 2
    setStep(startStep)
    setFurthest(startStep)
  }, [catalogue.data, searchParams])

  const data = catalogue.data
  const services = useMemo(() => data?.services ?? [], [data])
  const anySupportsFrequency = useMemo(
    () => services.some((s) => selectedServiceIds.includes(s.id) && s.supports_frequency),
    [services, selectedServiceIds],
  )

  const quote = useMemo(
    () =>
      data
        ? computeQuote(
            { selectedServiceIds, bandCode, frequencyCode, postcode: address.postcode },
            data,
          )
        : null,
    [data, selectedServiceIds, bandCode, frequencyCode, address.postcode],
  )

  const matchedArea = useMemo(
    () => (data ? matchArea(address.postcode, data.areas) : null),
    [data, address.postcode],
  )

  const bandLabel = data?.bands.find((b) => b.code === bandCode)?.label ?? null
  const frequencyLabel = data?.frequencies.find((f) => f.code === frequencyCode)?.label ?? null

  // ---- Field handlers ----
  const clearError = useCallback((key: string) => {
    setErrors((e) => {
      if (!(key in e)) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }, [])

  const toggleService = useCallback(
    (id: string) => {
      setSelectedServiceIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      )
      clearError('services')
    },
    [clearError],
  )

  const updateAddress = useCallback(
    (field: keyof AddressState, value: string) => {
      setAddress((a) => ({ ...a, [field]: value }))
      if (field === 'line1' || field === 'postcode') clearError(field)
    },
    [clearError],
  )

  const updateDetails = useCallback(
    (field: keyof DetailsState, value: string) => {
      setDetails((d) => ({ ...d, [field]: value }))
      clearError(field)
    },
    [clearError],
  )

  const quoteView: QuoteView = {
    quote,
    bandLabel,
    frequencyLabel,
    showFrequency: anySupportsFrequency,
    postcode: address.postcode,
    upsell: {
      services,
      prices: data?.prices ?? [],
      bundles: data?.bundles ?? [],
      selectedIds: selectedServiceIds,
      bandCode,
      onAdd: toggleService,
    },
  }

  // ---- Validation ----
  function validateStep(n: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (n === 1 && selectedServiceIds.length === 0) {
      e.services = 'Choose at least one service to continue.'
    }
    if (n === 2 && !bandCode) {
      e.band = 'Please choose your property size.'
    }
    if (n === 3) {
      if (!address.line1.trim()) e.line1 = 'We need your address to book the clean.'
      if (!address.postcode.trim()) e.postcode = 'Enter your postcode so we can check we cover you.'
    }
    if (n === 4) {
      if (!date) e.date = 'Please pick a day.'
      else if (!time) e.time = 'Please pick a time.'
    }
    if (n === 5) {
      if (!details.name.trim()) e.name = 'Please tell us your name.'
      if (!details.email.trim()) e.email = 'We need an email to confirm your booking.'
      else if (!EMAIL_RE.test(details.email.trim())) e.email = 'That email doesn’t look right.'
      if (!details.phone.trim()) e.phone = 'A phone number helps us confirm quickly.'
    }
    return e
  }

  // ---- Navigation ----
  const navigateTo = useCallback(
    (n: number) => {
      if (n >= 1 && n <= furthest && n !== step) {
        setStep(n)
        setErrors({})
        scrollToTop()
      }
    },
    [furthest, step],
  )

  async function submit() {
    if (!quote) return
    setSubmitting(true)
    setSubmitError(false)

    const items: BookingItem[] = quote.lines.map((l) => ({
      service_id: l.service_id,
      slug: l.slug,
      name: l.name,
      unit_price: l.unit_price,
      line_total: l.line_total,
    }))

    const payload: BookingInsert = {
      customer_name: details.name.trim(),
      email: details.email.trim(),
      phone: details.phone.trim(),
      address_line1: address.line1.trim(),
      address_line2: address.line2.trim(),
      city: address.city.trim(),
      postcode: address.postcode.trim().toUpperCase(),
      area_name: quote.areaName,
      property_band: bandCode,
      frequency: anySupportsFrequency ? frequencyCode : 'one_off',
      service_date: date,
      start_time: time,
      duration_minutes: quote.durationMinutes,
      items,
      subtotal: quote.subtotal,
      discount_amount: quote.discountAmount,
      surcharge_amount: quote.surcharge,
      total: quote.total,
      customer_notes: details.notes.trim(),
    }

    try {
      const reference = await insertBooking(payload)
      navigate('/booking/confirmed', {
        state: { reference, quote, date, time, name: details.name.trim(), items },
      })
    } catch {
      setSubmitError(true)
      setSubmitting(false)
    }
  }

  function goNext() {
    if (step < TOTAL_STEPS) {
      const e = validateStep(step)
      if (Object.keys(e).length > 0) {
        setErrors(e)
        return
      }
      setErrors({})
      const next = step + 1
      setStep(next)
      setFurthest((f) => Math.max(f, next))
      scrollToTop()
      return
    }

    // Final step — re-check everything, jump to the first problem if any.
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const e = validateStep(s)
      if (Object.keys(e).length > 0) {
        setErrors(e)
        setStep(s)
        scrollToTop()
        return
      }
    }
    setErrors({})
    void submit()
  }

  function goBack() {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
      scrollToTop()
    }
  }

  function renderStep(cat: CatalogueData) {
    switch (step) {
      case 1:
        return (
          <StepServices
            services={cat.services}
            selectedIds={selectedServiceIds}
            onToggle={toggleService}
            error={errors.services}
          />
        )
      case 2:
        return (
          <StepProperty
            bands={cat.bands}
            bandCode={bandCode}
            onBandChange={(c) => {
              setBandCode(c)
              clearError('band')
            }}
            frequencies={cat.frequencies}
            frequencyCode={frequencyCode}
            onFrequencyChange={setFrequencyCode}
            showFrequency={anySupportsFrequency}
            error={errors.band}
          />
        )
      case 3:
        return (
          <StepAddress
            address={address}
            onChange={updateAddress}
            matchedArea={matchedArea}
            errors={{ line1: errors.line1, postcode: errors.postcode }}
          />
        )
      case 4:
        return (
          <StepDateTime
            hours={cat.hours}
            intervalMinutes={settings.booking.slot_interval_minutes}
            minNoticeHours={settings.booking.min_notice_hours}
            maxDaysAhead={settings.booking.max_days_ahead}
            durationMinutes={quote?.durationMinutes ?? 0}
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            errors={{ date: errors.date, time: errors.time }}
          />
        )
      case 5:
        return (
          <StepReview
            lines={quote?.lines ?? []}
            bandLabel={bandLabel}
            frequencyLabel={frequencyLabel}
            showFrequency={anySupportsFrequency}
            address={address}
            date={date}
            time={time}
            details={details}
            onDetailsChange={updateDetails}
            errors={{ name: errors.name, email: errors.email, phone: errors.phone }}
            onEdit={navigateTo}
            quoteView={quoteView}
          />
        )
      default:
        return null
    }
  }

  const isLastStep = step === TOTAL_STEPS

  return (
    <>
      <div className="border-b border-pane/70 bg-gradient-to-b from-pane/40 to-paper">
        <Container className="py-10 sm:py-12">
          <SectionHeading
            as="h1"
            eyebrow="Instant quote & booking"
            title="Build your quote"
            description="Answer a few quick questions and watch your price update live. It only takes a minute, and there's nothing to pay now."
          />
        </Container>
      </div>

      <section className="py-10 sm:py-12">
        <Container>
          {catalogue.loading && <LoadingState message="Loading the booking tool…" />}
          {catalogue.error && <ErrorState onRetry={catalogue.reload} />}

          {!catalogue.loading && !catalogue.error && data && (
            <>
              <Stepper steps={STEP_LABELS} current={step} furthest={furthest} onNavigate={navigateTo} />

              <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
                <div className="min-w-0 pb-28 lg:pb-0">
                  <div key={step} className="step-swap">
                    {renderStep(data)}
                  </div>

                  {submitError && isLastStep && (
                    <div
                      role="alert"
                      className="mt-6 flex items-start gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
                    >
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Something went wrong sending your booking. Please try again in a moment, or message us
                        and we'll sort it.
                      </span>
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      onClick={goBack}
                      disabled={step === 1 || submitting}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={submitting}
                      leftIcon={
                        submitting ? (
                          <Spinner size={18} className="text-ink" />
                        ) : isLastStep ? (
                          <Check className="h-4 w-4" />
                        ) : undefined
                      }
                      rightIcon={!isLastStep ? <ArrowRight className="h-4 w-4" /> : undefined}
                    >
                      {isLastStep ? (submitting ? 'Sending…' : 'Confirm booking') : 'Continue'}
                    </Button>
                  </div>
                </div>

                <QuotePanel {...quoteView} />
              </div>
            </>
          )}
        </Container>
      </section>
    </>
  )
}
