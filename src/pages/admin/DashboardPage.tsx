import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Clock,
  MapPin,
  MessageSquare,
  PoundSterling,
} from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { formatDate, formatGBP, formatTime } from '../../lib/format'
import type { Booking } from '../../lib/types'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states'
import { AdminHeading, BookingStatusBadge } from '../../components/admin/primitives'
import { fetchDashboardData, type DashboardData } from '../../components/admin/data'

function itemsSummary(booking: Booking): string {
  if (!booking.items || booking.items.length === 0) return '-'
  return booking.items.map((i) => i.name).join(', ')
}

function StatCard({
  to,
  icon,
  label,
  value,
  accent,
}: {
  to: string
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-card border border-pane bg-white p-5 shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block font-display text-3xl font-extrabold leading-none text-ink">{value}</span>
        <span className="mt-1 block text-sm font-medium text-ink-soft">{label}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-soft/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

const QUICK_LINKS = [
  { to: '/admin/services', label: 'Services & pricing', icon: <PoundSterling className="h-4 w-4" /> },
  { to: '/admin/areas', label: 'Areas covered', icon: <MapPin className="h-4 w-4" /> },
  { to: '/admin/availability', label: 'Availability', icon: <Clock className="h-4 w-4" /> },
  { to: '/admin/settings', label: 'Settings', icon: <ClipboardList className="h-4 w-4" /> },
]

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsync<DashboardData>(fetchDashboardData, [])

  return (
    <div className="space-y-8">
      <AdminHeading title="Dashboard" description="A quick look at what needs your attention." />

      {loading && <LoadingState message="Loading dashboard…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              to="/admin/bookings"
              icon={<CalendarClock className="h-6 w-6 text-amber-deep" />}
              label="Pending bookings"
              value={data.pending}
              accent="bg-amber/15"
            />
            <StatCard
              to="/admin/bookings"
              icon={<CalendarCheck className="h-6 w-6 text-teal-deep" />}
              label="Confirmed upcoming"
              value={data.confirmedUpcoming}
              accent="bg-teal/15"
            />
            <StatCard
              to="/admin/messages"
              icon={<MessageSquare className="h-6 w-6 text-teal-deep" />}
              label="New messages"
              value={data.newMessages}
              accent="bg-pane"
            />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Next 7 days</h2>
              <Link
                to="/admin/bookings"
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-deep hover:text-ink"
              >
                All bookings <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {data.upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="h-6 w-6" />}
                title="Nothing booked in the next week"
                body="Pending and confirmed bookings for the coming 7 days will show up here."
              />
            ) : (
              <ul className="space-y-2.5">
                {data.upcoming.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      to="/admin/bookings"
                      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-card border border-pane bg-white px-4 py-3 shadow-card transition-colors hover:bg-pane/20"
                    >
                      <span className="flex w-32 shrink-0 flex-col">
                        <span className="text-sm font-semibold text-ink">{formatDate(booking.service_date)}</span>
                        <span className="font-mono text-xs text-ink-soft">{formatTime(booking.start_time)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{booking.customer_name}</span>
                        <span className="block truncate text-sm text-ink-soft">{itemsSummary(booking)}</span>
                      </span>
                      <span className="font-mono text-sm text-ink-soft">{booking.postcode}</span>
                      <span className="font-mono text-sm font-semibold text-ink">{formatGBP(booking.total)}</span>
                      <BookingStatusBadge status={booking.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Quick links</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 rounded-card border border-pane bg-white px-4 py-3.5 text-sm font-semibold text-ink shadow-card transition-colors hover:bg-pane/20"
                >
                  <span className="text-teal-deep" aria-hidden="true">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
