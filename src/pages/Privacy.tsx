import { ScrollText } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Container } from '../components/ui/Container'
import { PageHeader } from '../components/layout/PageHeader'

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Who we are',
    body: 'Gleaming Ant provides window and exterior cleaning services in Essex. [PLACEHOLDER: registered business name, trading address and data-controller contact details.]',
  },
  {
    heading: '2. Information we collect',
    body: 'When you request a quote, book a clean or message us, we collect your name, contact details, address and the details of your enquiry. [PLACEHOLDER: confirm the full list of data collected and any analytics.]',
  },
  {
    heading: '3. How we use your information',
    body: 'We use your details to provide quotes, arrange and carry out cleans, take payment and stay in touch about your service. [PLACEHOLDER: confirm all processing purposes, including any marketing.]',
  },
  {
    heading: '4. Legal basis for processing',
    body: '[PLACEHOLDER: state the lawful bases relied on under UK GDPR — e.g. contract, legitimate interests, consent.]',
  },
  {
    heading: '5. Sharing your information',
    body: 'We do not sell your data. We use trusted service providers to run our website and store bookings securely. [PLACEHOLDER: list processors, e.g. hosting and database providers, and any payment provider.]',
  },
  {
    heading: '6. How long we keep it',
    body: '[PLACEHOLDER: define retention periods for enquiries, bookings and financial records.]',
  },
  {
    heading: '7. Your rights',
    body: 'You have rights over your personal data, including access, correction and erasure. [PLACEHOLDER: full statement of data-subject rights and how to exercise them, plus the ICO as supervisory authority.]',
  },
  {
    heading: '8. Cookies',
    body: '[PLACEHOLDER: describe any cookies or similar technologies used, or confirm the site is essential-cookies only.]',
  },
  {
    heading: '9. Contact',
    body: 'For any privacy question or request, contact us at [PLACEHOLDER: privacy contact email/phone].',
  },
]

export default function Privacy() {
  useDocumentTitle('Privacy Policy | Gleaming Ant')

  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" lead="How we handle your personal information." />
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
