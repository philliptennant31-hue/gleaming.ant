import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ClockIcon, RepeatIcon } from '../components/brand/icons-brand'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { fetchPropertyBands, fetchServiceBySlug, fetchServicePrices } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { formatDuration, formatGBP } from '../lib/format'
import type { PropertyBand, Service, ServicePrice } from '../lib/types'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states'
import { ServiceIcon } from '../components/brand/ServiceIcon'
import { Sparkle } from '../components/brand/Sparkle'
import { BeforeAfterSlider } from '../components/site/BeforeAfterSlider'

interface DetailData {
  service: Service | null
  bands: PropertyBand[]
  prices: ServicePrice[]
}

function PriceTable({ service, bands, prices }: { service: Service; bands: PropertyBand[]; prices: ServicePrice[] }) {
  if (bands.length === 0) {
    return (
      <p className="font-mono text-sm text-ink-soft">
        from {formatGBP(service.base_price)} {service.unit_label}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-pane">
            <th className="py-3 pr-4 text-sm font-semibold text-ink-soft">Property size</th>
            <th className="py-3 text-right text-sm font-semibold text-ink-soft">Price {service.unit_label}</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((band) => {
            const match = prices.find((p) => p.band_code === band.code)
            const price = match ? match.price : service.base_price
            return (
              <tr key={band.code} className="border-b border-pane/70 last:border-0">
                <td className="py-3 pr-4 text-ink">{band.label}</td>
                <td className="py-3 text-right font-mono font-semibold text-ink">{formatGBP(price)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Real-job media, keyed by service slug. Only services with genuine, honest
 * photos appear here (see docs/PLACEHOLDERS.md). We deliberately do NOT attach
 * photos to services whose only source imagery looked like stock/AI.
 */
interface BeforeAfterPair {
  before: string
  after: string
  beforeAlt: string
  afterAlt: string
  label: string
}
interface ServiceMedia {
  action?: { src: string; alt: string; caption: string; width: number; height: number }
  intro: string
  pairs: BeforeAfterPair[]
}
const SERVICE_MEDIA: Record<string, ServiceMedia> = {
  'window-cleaning': {
    action: {
      src: '/images/work/antony-reach-pole.jpg',
      alt: 'Antony cleaning an upstairs window from the ground with a water-fed pole',
      caption: 'Pure-water reach-and-wash, no ladders, out on our Essex round.',
      width: 750,
      height: 1000,
    },
    intro: 'Real jobs from our round, phone-shot as we work. Drag the sliders to compare.',
    pairs: [
      {
        before: '/images/work/window-before.jpg',
        after: '/images/work/window-after.jpg',
        beforeAlt: 'Dormer windows before cleaning, the glass dulled with dirt and watermarks',
        afterAlt: 'The same dormer windows after cleaning, the glass left clear',
        label: 'Windows',
      },
      {
        before: '/images/work/door-before.jpg',
        after: '/images/work/door-after.jpg',
        beforeAlt: 'A uPVC door frame and sill before cleaning, marked with grime and black spotting',
        afterAlt: 'The same uPVC door frame and sill after cleaning, back to clean white',
        label: 'Frames & doors',
      },
    ],
  },
}

function ServiceMediaBlock({ slug }: { slug: string }) {
  const media = SERVICE_MEDIA[slug]
  if (!media) return null

  return (
    <div className="mt-10 border-t border-pane pt-8">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-center">
        {media.action && (
          <figure className="m-0">
            <img
              src={media.action.src}
              alt={media.action.alt}
              width={media.action.width}
              height={media.action.height}
              loading="lazy"
              decoding="async"
              className="h-auto w-full rounded-card border border-pane object-cover shadow-card"
            />
            <figcaption className="mt-2 text-xs leading-relaxed text-ink-soft">{media.action.caption}</figcaption>
          </figure>
        )}
        <div>
          <h2 className="font-display text-xl font-bold text-ink">See the difference</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{media.intro}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {media.pairs.map((pair) => (
          <div key={pair.label}>
            <BeforeAfterSlider
              beforeSrc={pair.before}
              afterSrc={pair.after}
              beforeAlt={pair.beforeAlt}
              afterAlt={pair.afterAlt}
              width={600}
              height={555}
            />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{pair.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { data, loading, error, reload } = useAsync<DetailData>(async () => {
    const service = await fetchServiceBySlug(slug ?? '')
    if (!service) return { service: null, bands: [], prices: [] }
    const [bands, prices] = await Promise.all([fetchPropertyBands(), fetchServicePrices(service.id)])
    return { service, bands, prices }
  }, [slug])

  useDocumentTitle(data?.service ? `${data.service.name} | Gleaming Ant` : 'Service | Gleaming Ant')

  return (
    <>
      <div className="border-b border-pane/70 bg-gradient-to-b from-pane/45 to-paper">
        <Container className="py-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-deep hover:gap-2.5 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All services
          </Link>
        </Container>
      </div>

      <section className="py-12 sm:py-16">
        <Container>
          {loading && <LoadingState message="Loading service…" />}
          {error && <ErrorState onRetry={reload} />}
          {!loading && !error && data && !data.service && (
            <EmptyState
              icon={<ServiceIcon name="sparkles" className="h-6 w-6" />}
              title="We couldn't find that service"
              body="It may have moved or been renamed. Browse everything we clean instead."
              action={
                <Button to="/services" variant="secondary" size="sm">
                  View all services
                </Button>
              }
            />
          )}

          {!loading && !error && data && data.service && (
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              {/* Story */}
              <div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-pane">
                    <ServiceIcon name={data.service.icon} className="h-7 w-7" />
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.service.supports_frequency && (
                      <Badge tone="teal" leftIcon={<RepeatIcon className="h-3.5 w-3.5" />}>
                        Regular option
                      </Badge>
                    )}
                    <Badge tone="neutral" leftIcon={<ClockIcon className="h-3.5 w-3.5" />}>
                      {formatDuration(data.service.duration_minutes)} typical
                    </Badge>
                  </div>
                </div>

                <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-ink">
                  {data.service.name}
                </h1>
                <p className="mt-3 text-lg text-ink-soft">{data.service.short_description}</p>
                <p className="mt-6 whitespace-pre-line leading-relaxed text-ink">
                  {data.service.long_description}
                </p>

                <ServiceMediaBlock slug={data.service.slug} />

                <div className="mt-8">
                  <Button
                    to={`/booking?services=${data.service.slug}`}
                    size="lg"
                    rightIcon={<ArrowRight className="h-5 w-5" />}
                  >
                    Book this clean
                  </Button>
                </div>
              </div>

              {/* Pricing panel */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="relative overflow-hidden rounded-card border border-pane bg-white p-6 shadow-card">
                  <Sparkle size={16} className="absolute right-5 top-5 text-teal/40" />
                  <h2 className="font-display text-lg font-bold text-ink">Guide prices</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Priced by property size. Your exact quote is confirmed instantly when you book.
                  </p>
                  <div className="mt-4">
                    <PriceTable service={data.service} bands={data.bands} prices={data.prices} />
                  </div>
                  {data.service.price_note && (
                    <p className="mt-4 rounded-lg bg-pane/50 px-3 py-2 text-xs text-ink-soft">
                      {data.service.price_note}
                    </p>
                  )}
                  <div className="mt-5">
                    <Button to={`/booking?services=${data.service.slug}`} fullWidth>
                      Get your exact quote
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
