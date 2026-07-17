import { ArrowRight, Check, MessageCircle } from 'lucide-react'
import { MapPinIcon } from '../components/brand/icons-brand'
import { useAsync } from '../lib/useAsync'
import { fetchServiceAreas } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { formatGBP } from '../lib/format'
import type { ServiceArea } from '../lib/types'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states'
import { PageHeader } from '../components/layout/PageHeader'

function AreaCard({ area }: { area: ServiceArea }) {
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pane text-teal-deep">
            <MapPinIcon className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-bold text-ink">{area.name}</h2>
        </div>
        <Badge tone={area.is_core ? 'teal' : 'neutral'}>{area.is_core ? 'Core area' : 'Surrounding'}</Badge>
      </div>

      {area.postcode_prefixes.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {area.postcode_prefixes.map((prefix) => (
            <li
              key={prefix}
              className="rounded-md bg-ink/5 px-2.5 py-1 font-mono text-xs font-semibold text-ink-soft"
            >
              {prefix}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <Check className="h-4 w-4 text-teal" aria-hidden="true" />
        {area.surcharge > 0
          ? `Covered with a small ${formatGBP(area.surcharge)} travel charge`
          : 'No travel surcharge'}
      </p>
    </Card>
  )
}

export default function Areas() {
  useDocumentTitle('Areas We Cover | Gleaming Ant')
  const { data, loading, error, reload } = useAsync<ServiceArea[]>(fetchServiceAreas, [])

  return (
    <>
      <PageHeader
        eyebrow="Areas"
        title="Covering South Essex"
        lead="We're based in the heart of South Essex and cover the towns below plus the surrounding villages. Not sure about your postcode? We'll always let you know."
      >
        <Button to="/booking" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Check your postcode
        </Button>
      </PageHeader>

      <section className="py-14 sm:py-16">
        <Container>
          {loading && <LoadingState message="Loading areas…" />}
          {error && <ErrorState onRetry={reload} />}
          {!loading && !error && data && data.length === 0 && (
            <EmptyState
              icon={<MapPinIcon className="h-6 w-6" />}
              title="Area list coming soon"
              body="We're mapping out our coverage. Message us with your postcode and we'll confirm."
            />
          )}
          {!loading && !error && data && data.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((area) => (
                <AreaCard key={area.id} area={area} />
              ))}
            </div>
          )}

          {/* Outside-area reassurance */}
          <div className="mt-10 rounded-card border border-pane bg-pane/30 p-7 sm:p-9">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-xl font-bold text-ink">Just outside our patch?</h2>
                <p className="mt-2 text-ink-soft">
                  Pop your postcode into the booking tool. If you're a little further out we'll still show
                  you a quote and confirm by message before anything's booked. No obligation either way.
                </p>
              </div>
              <Button to="/contact" variant="secondary" leftIcon={<MessageCircle className="h-4 w-4" />}>
                Ask about your area
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
