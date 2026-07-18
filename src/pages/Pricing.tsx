import { ArrowRight } from 'lucide-react'
import { BundleIcon, PercentIcon, RepeatIcon } from '../components/brand/icons-brand'
import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import {
  fetchActiveServices,
  fetchBundleDiscounts,
  fetchFrequencies,
  fetchPropertyBands,
  fetchServicePrices,
} from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { formatGBP } from '../lib/format'
import type { BundleDiscount, Frequency, PropertyBand, Service, ServicePrice } from '../lib/types'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { LoadingState, ErrorState } from '../components/ui/states'
import { PageHeader } from '../components/layout/PageHeader'
import { ServiceIcon } from '../components/brand/ServiceIcon'
import { Reveal } from '../components/site/Reveal'

interface PricingData {
  services: Service[]
  bands: PropertyBand[]
  prices: ServicePrice[]
  frequencies: Frequency[]
  bundles: BundleDiscount[]
}

function PriceMatrix({ services, bands, prices }: Pick<PricingData, 'services' | 'bands' | 'prices'>) {
  const priceFor = (serviceId: string, bandCode: string, base: number) =>
    prices.find((p) => p.service_id === serviceId && p.band_code === bandCode)?.price ?? base

  return (
    <div className="overflow-x-auto rounded-card border border-pane bg-white shadow-card">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-pane bg-pane/30">
            <th className="sticky left-0 z-10 bg-pane/30 px-5 py-4 text-sm font-bold text-ink">Service</th>
            {bands.map((band) => (
              <th key={band.code} className="px-5 py-4 text-right text-sm font-bold text-ink">
                {band.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b border-pane/60 last:border-0 hover:bg-pane/15">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-5 py-4 text-left font-semibold text-ink"
              >
                <span className="flex items-center gap-2.5">
                  <ServiceIcon name={service.icon} className="h-4 w-4 shrink-0 text-teal-deep" />
                  <Link
                    to={`/booking?services=${service.slug}`}
                    className="rounded-sm text-ink hover:text-teal-deep hover:underline"
                  >
                    {service.name}
                  </Link>
                </span>
                <Link
                  to={`/booking?services=${service.slug}`}
                  aria-label={`Quote ${service.name}`}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-teal-deep hover:gap-1.5 hover:text-ink"
                >
                  Quote this
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </th>
              {bands.map((band) => (
                <td key={band.code} className="px-5 py-4 text-right font-mono text-ink">
                  {formatGBP(priceFor(service.id, band.code, service.base_price))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FrequencyExplainer({ frequencies }: { frequencies: Frequency[] }) {
  if (frequencies.length === 0) return null
  const oneOff = Math.max(...frequencies.map((f) => f.multiplier))
  const cheapest = Math.min(...frequencies.map((f) => f.multiplier))

  return (
    <Reveal as="div" stagger className="grid gap-4 sm:grid-cols-3">
      {frequencies.map((freq) => {
        const savings = oneOff > 0 ? Math.round((1 - freq.multiplier / oneOff) * 100) : 0
        const isBest = freq.multiplier === cheapest
        return (
          <div
            key={freq.code}
            className={`rounded-card border p-5 ${isBest ? 'border-teal bg-teal/5' : 'border-pane bg-white'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <RepeatIcon className="h-5 w-5" />
              {isBest ? (
                <Badge tone="teal">Best value</Badge>
              ) : savings > 0 ? (
                <Badge tone="neutral">Save {savings}% vs one-off</Badge>
              ) : (
                <Badge tone="amber">One-off</Badge>
              )}
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-ink">{freq.label}</h3>
            <p className="mt-1 text-sm text-ink-soft">
              {isBest
                ? 'Our lowest price per visit, spotless all year round.'
                : savings > 0
                  ? 'A relaxed regular round that still beats a one-off.'
                  : 'Perfect for a first clean or a one-time refresh.'}
            </p>
          </div>
        )
      })}
    </Reveal>
  )
}

export default function Pricing() {
  useDocumentTitle('Price List | Gleaming Ant')
  const { data, loading, error, reload } = useAsync<PricingData>(async () => {
    const [services, bands, prices, frequencies, bundles] = await Promise.all([
      fetchActiveServices(),
      fetchPropertyBands(),
      fetchServicePrices(),
      fetchFrequencies(),
      fetchBundleDiscounts(),
    ])
    return { services, bands, prices, frequencies, bundles }
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Clear prices, no surprises"
        lead="Prices are set by property size. Pick your services and property, and the booking tool gives you an exact quote in seconds."
      >
        <Button to="/booking" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Get an instant quote
        </Button>
      </PageHeader>

      <section className="py-14 sm:py-16">
        <Container>
          {loading && <LoadingState message="Loading prices…" />}
          {error && <ErrorState onRetry={reload} />}

          {!loading && !error && data && (
            <div className="space-y-14">
              {/* Matrix */}
              <div>
                <SectionHeading title="Price list" description="Guide prices by property size." />
                <p className="mt-3 text-sm text-ink-soft">
                  [PLACEHOLDER: prices shown are indicative and awaiting final sign-off from the client.]
                </p>
                <div className="mt-6">
                  <PriceMatrix services={data.services} bands={data.bands} prices={data.prices} />
                </div>
              </div>

              {/* Frequencies */}
              <div>
                <SectionHeading
                  eyebrow="Regular vs one-off"
                  title="The more regular, the less you pay"
                  description="Window cleaning and some other services support a regular round. Here's how the frequencies compare."
                />
                <div className="mt-6">
                  <FrequencyExplainer frequencies={data.frequencies} />
                </div>
              </div>

              {/* Bundles */}
              {data.bundles.length > 0 && (
                <div className="rounded-card border border-amber/30 bg-amber/5 p-7 sm:p-9">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber/15 text-amber-deep">
                      <BundleIcon className="h-6 w-6" />
                    </span>
                    <h2 className="font-display text-2xl font-bold text-ink">Bundle &amp; save</h2>
                  </div>
                  <p className="mt-3 max-w-2xl text-ink-soft">
                    Booking more than one service in a single visit? We take a slice off the total.
                    The more you bundle, the bigger the discount.
                  </p>
                  <ul className="mt-6 flex flex-wrap gap-4">
                    {data.bundles.map((bundle) => (
                      <li
                        key={bundle.id}
                        className="flex items-center gap-3 rounded-xl border border-pane bg-white px-5 py-4"
                      >
                        <PercentIcon className="h-5 w-5 shrink-0" />
                        <span className="text-ink">
                          <span className="font-mono text-lg font-semibold">{bundle.discount_percent}%</span> off{' '}
                          {bundle.min_services}+ services
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col items-center gap-5 rounded-card bg-pane/40 p-8 text-center sm:p-12">
                <SectionHeading
                  align="center"
                  title="See your exact price"
                  description="Every quote is worked out live from this price list, bundles and area checks included."
                />
                <Button to="/booking" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Get an instant quote
                </Button>
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
