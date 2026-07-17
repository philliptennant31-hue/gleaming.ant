import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { ErrorState, LoadingState } from '../../components/ui/states'
import { ToastProvider } from '../../components/admin/primitives'
import { AdminShell } from '../../components/admin/AdminShell'
import DashboardPage from './DashboardPage'
import BookingsPage from './BookingsPage'
import ServicesPage from './ServicesPage'
import AreasPage from './AreasPage'
import AvailabilityPage from './AvailabilityPage'
import MessagesPage from './MessagesPage'
import SettingsPage from './SettingsPage'

type GuardState = 'checking' | 'error' | 'no-session' | 'ready'

/**
 * The whole `/admin/*` shell. Guards access on two levels:
 *  1. A Supabase auth session must exist (magic-link sign-in) — else redirect to
 *     /admin/login.
 *  2. The signed-in email must be on the `admin_emails` allowlist. RLS returns
 *     the row ONLY for admins, so an empty result means "not authorised": we sign
 *     the user out and bounce to login with a message.
 * Rendered outside the public Layout — it builds its own chrome (AdminShell).
 */
export default function AdminApp() {
  useDocumentTitle('Admin | Gleaming Ant')
  const [state, setState] = useState<GuardState>('checking')
  const [email, setEmail] = useState('')
  const deniedRef = useRef(false)

  const verify = useCallback(async (session: Session | null) => {
    const userEmail = session?.user?.email
    if (!userEmail) {
      setState('no-session')
      return
    }
    const { data, error } = await supabase
      .from('admin_emails')
      .select('email')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    if (error) {
      // Network / unexpected error — don't sign the user out, offer a retry.
      setState('error')
      return
    }
    if (!data) {
      // Authenticated but not on the allowlist (RLS filtered every row out).
      deniedRef.current = true
      await supabase.auth.signOut() // SIGNED_OUT re-runs verify(null) -> redirect
      return
    }
    deniedRef.current = false
    setEmail(userEmail)
    setState('ready')
  }, [])

  useEffect(() => {
    let active = true
    // onAuthStateChange emits INITIAL_SESSION after the client finishes reading
    // storage AND processing the magic-link hash, so it handles both the stored
    // session and the redirect-from-email cases. Defer the async work out of the
    // callback — calling supabase inside it directly can deadlock the auth lock.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      window.setTimeout(() => {
        if (active) void verify(session)
      }, 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [verify])

  const handleSignOut = useCallback(() => {
    void supabase.auth.signOut()
  }, [])

  const retry = useCallback(() => {
    setState('checking')
    supabase.auth.getSession().then(({ data }) => void verify(data.session))
  }, [verify])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <LoadingState message="Checking your access…" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <ErrorState onRetry={retry} message="We couldn't verify your access just now. Please try again." />
      </div>
    )
  }

  if (state === 'no-session') {
    return (
      <Navigate to="/admin/login" replace state={deniedRef.current ? { notAuthorised: true } : undefined} />
    )
  }

  return (
    <ToastProvider>
      <AdminShell email={email} onSignOut={handleSignOut}>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="areas" element={<AreasPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminShell>
    </ToastProvider>
  )
}
