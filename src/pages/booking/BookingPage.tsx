import { CalendarClock } from 'lucide-react'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { Button } from '../../components/ui/Button'
import { ComingSoon } from '../../components/site/ComingSoon'

/**
 * Phase 1 stub. Phase 2 replaces this file's contents with the booking wizard
 * (services -> property & frequency -> postcode -> date & time -> review) and a
 * live quote panel. It never edits App.tsx.
 */
export default function BookingPage() {
  useDocumentTitle('Get an instant quote | Gleaming Ant')

  return (
    <ComingSoon
      eyebrow="Instant quote & booking"
      icon={<CalendarClock className="h-7 w-7" aria-hidden="true" />}
      title="The booking tool is on its way"
      body="You'll soon be able to build a quote and book your clean right here — choose your services, property size and a time that suits you, with the price worked out live."
      phase="Arriving in Phase 2"
      actions={
        <>
          <Button to="/pricing" variant="secondary">
            See our prices
          </Button>
          <Button to="/contact">Message us for a quote</Button>
        </>
      }
    />
  )
}
