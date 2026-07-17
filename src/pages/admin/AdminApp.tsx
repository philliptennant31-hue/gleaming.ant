import { Link } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/brand/Logo'
import { ComingSoon } from '../../components/site/ComingSoon'

/**
 * Phase 1 stub for the whole `/admin/*` shell. Phase 3 replaces this file with
 * the admin dashboard (auth guard + nested routes: bookings, services & pricing,
 * areas, availability, messages, settings). Rendered outside the public Layout.
 */
export default function AdminApp() {
  useDocumentTitle('Admin | Gleaming Ant')

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex items-center justify-between border-b border-pane px-6 py-4">
        <Link to="/" aria-label="Gleaming Ant — home">
          <Logo badgeSize={36} />
        </Link>
        <Button to="/admin/login" variant="ghost" size="sm">
          Sign in
        </Button>
      </div>
      <div className="flex flex-1 items-center">
        <ComingSoon
          eyebrow="Admin dashboard"
          icon={<LayoutDashboard className="h-7 w-7" aria-hidden="true" />}
          title="The management dashboard is coming soon"
          body="Bookings, pricing, areas, availability, messages and settings will all be managed here by the Gleaming Ant team."
          phase="Arriving in Phase 3"
          actions={
            <Button to="/" variant="secondary">
              Back to the site
            </Button>
          }
        />
      </div>
    </div>
  )
}
