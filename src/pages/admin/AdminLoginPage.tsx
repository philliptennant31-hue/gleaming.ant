import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, KeyRound, MailCheck, TriangleAlert } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Logo } from '../../components/brand/Logo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_SECONDS = 40

/**
 * Passwordless admin sign-in via Supabase magic link / email OTP. Anyone can
 * request a link, but only emails on the `admin_emails` allowlist get past the
 * guard in AdminApp — so the copy sets that expectation up front.
 */
export default function AdminLoginPage() {
  useDocumentTitle('Admin sign in | Gleaming Ant')
  const location = useLocation()
  const notAuthorised = (location.state as { notAuthorised?: boolean } | null)?.notAuthorised ?? false

  const [hasSession, setHasSession] = useState(false)
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [sendError, setSendError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // A live session means an admin landed here already signed in (or clicked the
  // link) — hand them to the dashboard, which does the allowlist check.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  async function sendLink(target: string) {
    setSendError(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    setBusy(false)
    if (error) {
      setSendError(error.message || 'We could not send the link. Please try again in a moment.')
      return
    }
    setSentEmail(target)
    setCooldown(RESEND_SECONDS)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError('Enter your email to get a sign-in link.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('That email doesn’t look right.')
      return
    }
    setFieldError(undefined)
    void sendLink(trimmed)
  }

  if (hasSession) return <Navigate to="/admin" replace />

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="border-b border-pane px-6 py-4">
        <Link to="/" aria-label="Gleaming Ant home">
          <Logo badgeSize={36} />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-card border border-pane bg-white p-7 shadow-card sm:p-8">
            {sentEmail ? (
              <div className="text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-teal-deep">
                  <MailCheck className="h-7 w-7" aria-hidden="true" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-bold text-ink">Check your inbox</h1>
                <p className="mt-2 text-ink-soft">
                  We’ve sent a magic link to <span className="font-semibold text-ink">{sentEmail}</span>. Open it on
                  this device to sign in, no password needed.
                </p>
                <p className="mt-4 text-sm text-ink-soft">
                  Didn’t get it? Check spam, or resend below.
                </p>

                {sendError && (
                  <p className="mt-3 text-sm text-danger" role="alert">
                    {sendError}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={cooldown > 0 || busy}
                    onClick={() => void sendLink(sentEmail)}
                    leftIcon={busy ? <Spinner size={18} className="text-teal-deep" /> : undefined}
                  >
                    {cooldown > 0 ? `Resend link in ${cooldown}s` : busy ? 'Sending…' : 'Resend magic link'}
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setSentEmail(null)
                      setSendError(null)
                    }}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pane text-teal-deep">
                  <KeyRound className="h-6 w-6" aria-hidden="true" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-bold text-ink">Team sign-in</h1>
                <p className="mt-2 text-ink-soft">
                  Enter your email and we’ll send a magic link. No passwords to remember.
                </p>

                {notAuthorised && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
                  >
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      That email isn’t authorised for the dashboard. If it should be, ask an existing admin to add
                      it under Settings.
                    </span>
                  </div>
                )}

                <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
                  <Input
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldError) setFieldError(undefined)
                    }}
                    error={fieldError}
                  />

                  {sendError && (
                    <p className="text-sm text-danger" role="alert">
                      {sendError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={busy}
                    leftIcon={busy ? <Spinner size={18} className="text-ink" /> : undefined}
                  >
                    {busy ? 'Sending link…' : 'Send magic link'}
                  </Button>
                </form>

                <p className="mt-5 text-xs leading-relaxed text-ink-soft">
                  Only pre-authorised Gleaming Ant team emails can access the dashboard. You can request a link with
                  any email, but you’ll be signed out at the door if it isn’t on the list.
                </p>
              </>
            )}
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="text-sm font-semibold text-teal-deep hover:text-ink">
              ← Back to the site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
