import { CheckCircle2 } from 'lucide-react'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { ComingSoon } from '../../components/site/ComingSoon'

/**
 * Phase 1 stub. Phase 2 replaces this with the confirmation screen that reads
 * the booking reference and breakdown from router state.
 */
export default function BookingConfirmedPage() {
  useDocumentTitle('Booking confirmed | Gleaming Ant')

  return (
    <ComingSoon
      eyebrow="Confirmation"
      icon={<CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
      title="Your booking confirmation will appear here"
      body="Once the booking tool is live, this is where you'll see your reference, your price breakdown and what happens next."
      phase="Arriving in Phase 2"
    />
  )
}
