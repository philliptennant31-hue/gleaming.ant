import { ScrollText } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Container } from '../components/ui/Container'
import { PageHeader } from '../components/layout/PageHeader'

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. About these terms',
    body: 'These terms cover the cleaning services provided by Gleaming Ant. [PLACEHOLDER: registered business name and trading details.] By booking a clean you agree to these terms.',
  },
  {
    heading: '2. Quotes and pricing',
    body: 'Prices shown online are guides based on property size and may be confirmed before work begins. [PLACEHOLDER: confirm how quotes are finalised and how long a quote is valid.]',
  },
  {
    heading: '3. Booking and cancellation',
    body: '[PLACEHOLDER: set out how bookings are confirmed, notice required to cancel or reschedule, and any charges for missed visits.]',
  },
  {
    heading: '4. Access to your property',
    body: 'We need safe access to the areas being cleaned, for example a side gate for rear windows. [PLACEHOLDER: confirm access and payment arrangements when you are not at home.]',
  },
  {
    heading: '5. Payment',
    body: '[PLACEHOLDER: confirm accepted payment methods, when payment is due, and terms for regular rounds.]',
  },
  {
    heading: '6. Weather',
    body: 'A professional clean is unaffected by light rain and your windows will still dry clear. If weather would affect the result we will rearrange. [PLACEHOLDER: confirm the rain/weather policy and any guarantee.]',
  },
  {
    heading: '7. Insurance and liability',
    body: 'Gleaming Ant is fully insured. [PLACEHOLDER: set out the scope of insurance and the limits of liability, reviewed by a solicitor.]',
  },
  {
    heading: '8. Satisfaction and complaints',
    body: '[PLACEHOLDER: describe how to raise a problem, the timeframe to report it, and how issues are put right.]',
  },
  {
    heading: '9. Governing law',
    body: 'These terms are governed by the law of England and Wales. [PLACEHOLDER: confirm jurisdiction wording with a solicitor.]',
  },
]

export default function Terms() {
  useDocumentTitle('Terms of Service | Gleaming Ant')

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        lead="The terms that apply when you book a clean with us."
      />
      <section className="py-14 sm:py-16">
        <Container size="narrow">
          <div className="flex items-start gap-3 rounded-card border border-amber/30 bg-amber/5 p-5">
            <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-amber-deep" aria-hidden="true" />
            <p className="text-sm text-ink">
              <strong>[PLACEHOLDER: draft for review.]</strong> This is scaffold text only and is{' '}
              <strong>not legal advice</strong>. It must be reviewed, completed and approved by a qualified
              solicitor before the site goes live.
            </p>
          </div>

          <p className="mt-6 text-sm text-ink-soft">Last updated: [PLACEHOLDER: date]</p>

          <div className="mt-6 space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display text-xl font-bold text-ink">{section.heading}</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">{section.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
