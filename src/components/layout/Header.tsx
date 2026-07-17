import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { PRIMARY_NAV, INSTAGRAM_URL } from '../../lib/nav'
import { cn } from '../../lib/cn'
import { Logo } from '../brand/Logo'
import { Sparkle } from '../brand/Sparkle'
import { InstagramIcon } from '../brand/icons'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'

function desktopLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative text-sm font-semibold transition-colors py-1',
    'after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-deep after:transition-all',
    isActive
      ? 'text-teal-deep after:w-full'
      : 'text-ink-soft hover:text-ink after:w-0 hover:after:w-full after:bg-teal/50',
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const closeRef = useRef<HTMLButtonElement>(null)

  // Close the mobile sheet whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Esc to close + lock body scroll + focus the close button while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-pane/80 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label="Gleaming Ant — home" className="rounded-lg">
            <Logo badgeSize={38} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button to="/booking" size="sm">
              Get an instant quote
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-pane/70 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </Container>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="bg-chalkboard on-deep fixed inset-0 z-50 flex flex-col text-white lg:hidden"
        >
          <Sparkle size={16} className="absolute right-10 top-24 text-pane/40" />
          <Sparkle size={11} className="absolute right-20 top-36 text-amber/60" />

          <Container>
            <div className="flex h-16 items-center justify-between">
              <Logo tone="light" badgeSize={38} />
              <button
                ref={closeRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </Container>

          <nav className="flex flex-1 flex-col gap-1 px-6 pt-6" aria-label="Mobile">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-3 font-display text-2xl font-bold tracking-tight transition-colors',
                    isActive ? 'text-white' : 'text-pane/85 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-4 px-6 pb-8 pt-4">
            <Button to="/booking" size="lg" fullWidth>
              Get an instant quote
            </Button>
            <div className="flex items-center justify-between text-sm text-pane/80">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <InstagramIcon className="h-4 w-4" />
                @gleaming.ant
              </a>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Fully insured
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
