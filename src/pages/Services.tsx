import { ArrowRight, Sparkles } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { fetchActiveServices } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Service } from '../lib/types'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states'
import { PageHeader } from '../components/layout/PageHeader'
import { ServiceCard } from '../components/site/ServiceCard'

export default function Services() {
  useDocumentTitle('Our Services | Gleaming Ant')
  const { data, loading, error, reload } = useAsync<Service[]>(fetchActiveServices, [])

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything we clean"
        lead="Windows are our bread and butter, but we look after the whole exterior. Pick a single job or bundle a few — every service comes with a free, upfront quote."
      >
        <Button to="/booking" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Get an instant quote
        </Button>
      </PageHeader>

      <section className="py-14 sm:py-16">
        <Container>
          {loading && <LoadingState message="Loading services…" />}
          {error && <ErrorState onRetry={reload} />}
          {!loading && !error && data && data.length === 0 && (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="Services coming soon"
              body="We're finalising our service list. Message us and we'll tell you exactly what we can do for you."
            />
          )}
          {!loading && !error && data && data.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
