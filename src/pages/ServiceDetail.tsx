import { ArrowLeft, ArrowRight, Clock, RefreshCw } from 'lucide-react'
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
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-deep text-white">
                    <ServiceIcon name={data.service.icon} className="h-7 w-7" />
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.service.supports_frequency && (
                      <Badge tone="teal" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                        Regular option
                      </Badge>
                    )}
                    <Badge tone="neutral" leftIcon={<Clock className="h-3.5 w-3.5" />}>
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

                <div className="mt-8">
                  <Button to="/booking" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
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
                    <Button to="/booking" fullWidth>
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
