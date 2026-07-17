import { ChevronDown, MessageCircle } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { fetchFaqs } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Faq } from '../lib/types'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states'
import { PageHeader } from '../components/layout/PageHeader'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  services: 'Services',
  pricing: 'Pricing & payment',
}
const CATEGORY_ORDER = ['general', 'services', 'pricing']

function orderedCategories(faqs: Faq[]): string[] {
  const present = Array.from(new Set(faqs.map((f) => f.category)))
  const known = CATEGORY_ORDER.filter((c) => present.includes(c))
  const rest = present.filter((c) => !CATEGORY_ORDER.includes(c)).sort()
  return [...known, ...rest]
}

function FaqItem({ faq }: { faq: Faq }) {
  return (
    <details className="group border-b border-pane last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-lg font-semibold text-ink">{faq.question}</span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-teal-deep transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="pb-5 pr-8 leading-relaxed text-ink-soft">{faq.answer}</p>
    </details>
  )
}

export default function FAQ() {
  useDocumentTitle('FAQs | Gleaming Ant')
  const { data, loading, error, reload } = useAsync<Faq[]>(fetchFaqs, [])

  return (
    <>
      <PageHeader
        eyebrow="FAQs"
        title="Questions, answered"
        lead="The things people ask us most. Can't find what you're after? We're a quick message away."
      />

      <section className="py-14 sm:py-16">
        <Container size="narrow">
          {loading && <LoadingState message="Loading FAQs…" />}
          {error && <ErrorState onRetry={reload} />}
          {!loading && !error && data && data.length === 0 && (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="No FAQs just yet"
              body="We're writing these up. In the meantime, ask us anything directly."
              action={
                <Button to="/contact" variant="secondary" size="sm">
                  Message us
                </Button>
              }
            />
          )}

          {!loading && !error && data && data.length > 0 && (
            <div className="space-y-10">
              {orderedCategories(data).map((category) => {
                const items = data.filter((f) => f.category === category)
                if (items.length === 0) return null
                return (
                  <div key={category}>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-teal-deep">
                      {CATEGORY_LABELS[category] ?? category}
                    </h2>
                    <div className="mt-2 rounded-card border border-pane bg-white px-6 shadow-card">
                      {items.map((faq) => (
                        <FaqItem key={faq.id} faq={faq} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-4 rounded-card bg-pane/40 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-ink">Still wondering about something?</h2>
            <p className="max-w-md text-ink-soft">
              Drop us a message and we'll get back to you. No question too small.
            </p>
            <Button to="/contact" leftIcon={<MessageCircle className="h-4 w-4" />}>
              Message us
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}
