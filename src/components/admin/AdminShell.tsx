import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  CalendarCheck,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  PoundSterling,
  Settings as SettingsIcon,
  X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { Logo } from '../../components/brand/Logo'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" />, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: <CalendarCheck className="h-[18px] w-[18px]" /> },
  { to: '/admin/services', label: 'Services & Pricing', icon: <PoundSterling className="h-[18px] w-[18px]" /> },
  { to: '/admin/areas', label: 'Areas', icon: <MapPin className="h-[18px] w-[18px]" /> },
  { to: '/admin/availability', label: 'Availability', icon: <Clock className="h-[18px] w-[18px]" /> },
  { to: '/admin/messages', label: 'Messages', icon: <MessageSquare className="h-[18px] w-[18px]" /> },
  { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon className="h-[18px] w-[18px]" /> },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-pane/85 hover:bg-white/10 hover:text-white',
            )
          }
        >
          <span className="shrink-0" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
      <Link
        to="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-pane/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ExternalLink className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        View site
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-pane/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        Sign out
      </button>
      <p className="truncate px-3 pt-2 text-xs text-pane/55" title={email}>
        {email}
      </p>
    </div>
  )
}

export function AdminShell({
  email,
  onSignOut,
  children,
}: {
  email: string
  onSignOut: () => void
  children: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Desktop sidebar */}
      <aside className="bg-chalkboard sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 px-4 py-5 lg:flex">
        <Link to="/admin" aria-label="Gleaming Ant admin dashboard" className="px-2">
          <Logo badgeSize={34} tone="light" />
        </Link>
        <NavItems />
        <SidebarFooter email={email} onSignOut={onSignOut} />
      </aside>

      {/* Mobile top bar */}
      <div className="bg-chalkboard sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link to="/admin" aria-label="Gleaming Ant admin dashboard">
          <Logo badgeSize={30} tone="light" />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-pane hover:bg-white/10"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-ink/50" aria-hidden="true" onClick={() => setDrawerOpen(false)} />
          <div className="bg-chalkboard relative flex h-full w-72 max-w-[80%] flex-col gap-6 px-4 py-5">
            <div className="flex items-center justify-between">
              <Link
                to="/admin"
                aria-label="Gleaming Ant admin dashboard"
                onClick={() => setDrawerOpen(false)}
                className="px-1"
              >
                <Logo badgeSize={30} tone="light" />
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pane hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <NavItems onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter email={email} onSignOut={onSignOut} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  )
}

export default AdminShell
