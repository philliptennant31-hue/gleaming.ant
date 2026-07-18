import { Link } from 'react-router-dom'
import {
  ChatBubbleIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  ShieldTickIcon,
} from '../brand/icons-brand'
import { InstagramIcon } from '../brand/icons'
import { fetchBusinessHours } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { useSiteSettings } from '../../lib/settings'
import { formatTime } from '../../lib/format'
import { PRIMARY_NAV, INSTAGRAM_URL } from '../../lib/nav'
import type { BusinessHours } from '../../lib/types'
import { Logo } from '../brand/Logo'
import { WipeEdge } from '../brand/WipeEdge'
import { Container } from '../ui/Container'

const AREAS = [
  'Basildon',
  'Billericay',
  'Wickford',
  'Brentwood',
  'Chelmsford',
  'Rayleigh',
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon-first, Sunday last

function isPlaceholder(value: string) {
  return !value || value.startsWith('[PLACEHOLDER')
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 text-teal" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-pane/60">{label}</span>
        {isPlaceholder(value) ? (
          <span className="font-mono text-sm text-pane/70">[PLACEHOLDER]</span>
        ) : href ? (
          <a href={href} className="text-sm text-white hover:text-pane">
            {value}
          </a>
        ) : (
          <span className="text-sm text-white">{value}</span>
        )}
      </span>
    </li>
  )
}

function HoursList() {
  const { data, loading, error } = useAsync<BusinessHours[]>(fetchBusinessHours, [])

  if (loading) return <p className="text-sm text-pane/60">Loading hours…</p>
  if (error || !data || data.length === 0) {
    return <p className="font-mono text-sm text-pane/70">[PLACEHOLDER: opening hours]</p>
  }

  const byDay = new Map(data.map((row) => [row.day_of_week, row]))

  return (
    <ul className="space-y-1.5">
      {DAY_ORDER.map((day) => {
        const row = byDay.get(day)
        const open = row?.is_open && row.open_time && row.close_time
        return (
          <li key={day} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-pane/75">{DAY_NAMES[day]}</span>
            <span className="font-mono text-white">
              {open ? `${formatTime(row!.open_time!)} – ${formatTime(row!.close_time!)}` : 'Closed'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function Footer() {
  const { settings } = useSiteSettings()
  const { contact } = settings
  const year = new Date().getFullYear()

  const waHref = isPlaceholder(contact.whatsapp)
    ? undefined
    : `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, '')}`

  return (
    <footer className="on-deep mt-auto">
      <WipeEdge fillSide="down" className="-mb-px" />
      <div className="bg-chalkboard text-pane/85">
        <Container className="py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Logo tone="light" badgeSize={44} withTagline />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-pane/75">
                Reliable, friendly and fully insured window &amp; exterior cleaning across Essex.
                Regular or one-off, always with a free quote.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-white hover:text-pane"
                >
                  <InstagramIcon className="h-4 w-4" />
                  @gleaming.ant
                </a>
                <span className="inline-flex items-center gap-1.5 text-pane/80">
                  <ShieldTickIcon className="h-4 w-4" aria-hidden="true" />
                  Fully insured
                </span>
              </div>
            </div>

            {/* Explore */}
            <nav className="lg:col-span-2" aria-label="Footer">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Explore</h2>
              <ul className="mt-4 space-y-2.5">
                {PRIMARY_NAV.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-sm text-pane/75 hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/booking" className="text-sm font-semibold text-amber hover:text-amber-deep">
                    Get an instant quote
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Areas */}
            <div className="lg:col-span-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Areas we cover</h2>
              <ul className="mt-4 space-y-2.5">
                {AREAS.map((area) => (
                  <li key={area} className="text-sm text-pane/75">
                    {area}
                  </li>
                ))}
                <li>
                  <Link to="/areas" className="text-sm font-semibold text-teal hover:text-white">
                    See all areas →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact + hours */}
            <div className="lg:col-span-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Get in touch</h2>
              <ul className="mt-4 space-y-3">
                <ContactRow
                  icon={<PhoneIcon className="h-4 w-4" />}
                  label="Phone"
                  value={contact.phone}
                  href={isPlaceholder(contact.phone) ? undefined : `tel:${contact.phone.replace(/\s/g, '')}`}
                />
                <ContactRow
                  icon={<MailIcon className="h-4 w-4" />}
                  label="Email"
                  value={contact.email}
                  href={isPlaceholder(contact.email) ? undefined : `mailto:${contact.email}`}
                />
                <ContactRow
                  icon={<ChatBubbleIcon className="h-4 w-4" />}
                  label="WhatsApp"
                  value={contact.whatsapp}
                  href={waHref}
                />
              </ul>
              <div className="mt-6">
                <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <ClockIcon className="h-4 w-4" aria-hidden="true" />
                  Hours
                </h3>
                <div className="mt-3">
                  <HoursList />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-pane/65 sm:flex-row sm:items-center">
            <p>© {year} Gleaming Ant. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  )
}

export default Footer
