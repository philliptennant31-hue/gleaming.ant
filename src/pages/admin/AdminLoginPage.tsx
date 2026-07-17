import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/brand/Logo'
import { ComingSoon } from '../../components/site/ComingSoon'

/**
 * Phase 1 stub. Phase 3 replaces this with magic-link / email-OTP sign-in
 * (supabase.auth.signInWithOtp). Rendered outside the public Layout.
 */
export default function AdminLoginPage() {
  useDocumentTitle('Admin sign in | Gleaming Ant')

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="border-b border-pane px-6 py-4">
        <Link to="/" aria-label="Gleaming Ant — home">
          <Logo badgeSize={36} />
        </Link>
      </div>
      <div className="flex flex-1 items-center">
        <ComingSoon
          eyebrow="Admin"
          icon={<KeyRound className="h-7 w-7" aria-hidden="true" />}
          title="Team sign-in is coming soon"
          body="Passwordless magic-link login for the Gleaming Ant team will live here."
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
