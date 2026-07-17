import { useEffect, useMemo, useState } from 'react'
import { Ban, CalendarCheck, Check, CircleCheck, Mail, MessageCircle, Send } from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { formatDate, formatDuration, formatGBP, formatTime } from '../../lib/format'
import type { Booking, BookingStatus } from '../../lib/types'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states'
import {
  AdminHeading,
  BookingStatusBadge,
  ConfirmDialog,
  DangerButton,
  SlideOver,
  TableCard,
  tdClass,
  thClass,
  useToast,
} from '../../components/admin/primitives'
import {
  fetchBookings,
  todayISO,
  updateBookingNotes,
  updateBookingStatus,
} from '../../components/admin/data'
import {
  buildConfirmationEmailLink,
  buildConfirmationSmsLink,
  requestConfirmationEmail,
} from '../../components/admin/notify'

type StatusFilter = 'all' | BookingStatus
type TimeFilter = 'upcoming' | 'past' | 'all'

function itemsSummary(booking: Booking): string {
  if (!booking.items || booking.items.length === 0) return '-'
  return booking.items.map((i) => i.name).join(', ')
}

export default function BookingsPage() {
  const { data, loading, error, reload } = useAsync<Booking[]>(fetchBookings, [])
  const toast = useToast()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [busyStatus, setBusyStatus] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [notifying, setNotifying] = useState(false)

  const selected = useMemo(
    () => data?.find((b) => b.id === selectedId) ?? null,
    [data, selectedId],
  )

  // Reset the notes editor whenever a different booking is opened / refreshed.
  useEffect(() => {
    setNotes(selected?.admin_notes ?? '')
  }, [selectedId, selected?.admin_notes])

  const today = todayISO()
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (timeFilter === 'upcoming' && b.service_date < today) return false
      if (timeFilter === 'past' && b.service_date >= today) return false
      if (q) {
        const hay = `${b.customer_name} ${b.reference} ${b.postcode}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [data, statusFilter, timeFilter, search, today])

  async function changeStatus(id: string, next: BookingStatus) {
    setBusyStatus(true)
    try {
      await updateBookingStatus(id, next)
      toast.show(`Booking marked ${next}.`)
      reload()
      // Fire-and-forget: the status change is already saved, so a notify
      // failure only ever produces a toast, never a rollback.
      if (next === 'confirmed') void notifyCustomer(id)
    } catch {
      toast.show('Could not update the booking. Try again.', 'error')
    } finally {
      setBusyStatus(false)
      setConfirmCancel(false)
    }
  }

  async function notifyCustomer(id: string) {
    setNotifying(true)
    const outcome = await requestConfirmationEmail(id)
    if (outcome.kind === 'sent') {
      toast.show(`Confirmation email sent to ${outcome.email}`)
    } else if (outcome.kind === 'not_configured') {
      toast.show('Automatic email is not set up yet, use the buttons below to send it yourself', 'info')
    } else {
      toast.show('Automatic email failed, use the buttons below', 'error')
    }
    setNotifying(false)
  }

  async function saveNotes(id: string) {
    setSavingNotes(true)
    try {
      await updateBookingNotes(id, notes)
      toast.show('Notes saved.')
      reload()
    } catch {
      toast.show('Could not save notes. Try again.', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeading title="Bookings" description="Every quote and booking that comes through the site." />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="sm:w-64">
          <Input
            label="Search"
            placeholder="Name, reference or postcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-44">
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <div className="sm:w-40">
          <Select label="When" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All dates</option>
          </Select>
        </div>
        <p className="text-sm text-ink-soft sm:ml-auto sm:pb-2.5">
          {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
        </p>
      </div>

      {loading && <LoadingState message="Loading bookings…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-6 w-6" />}
            title="No bookings match"
            body="Try widening the filters, or new bookings will appear here as they come in."
          />
        ) : (
          <TableCard minWidth={860}>
            <thead>
              <tr className="border-b border-pane bg-pane/30">
                <th className={thClass}>Date &amp; time</th>
                <th className={thClass}>Reference</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Area</th>
                <th className={thClass}>Services</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className="cursor-pointer border-b border-pane/60 last:border-0 hover:bg-pane/15"
                  onClick={() => setSelectedId(b.id)}
                >
                  <td className={tdClass}>
                    <span className="block font-medium text-ink">{formatDate(b.service_date)}</span>
                    <span className="font-mono text-xs text-ink-soft">{formatTime(b.start_time)}</span>
                  </td>
                  <td className={`${tdClass} font-mono text-xs`}>{b.reference}</td>
                  <td className={tdClass}>{b.customer_name}</td>
                  <td className={tdClass}>
                    <span className="block text-ink">{b.area_name || '-'}</span>
                    <span className="font-mono text-xs text-ink-soft">{b.postcode}</span>
                  </td>
                  <td className={`${tdClass} max-w-[16rem]`}>
                    <span className="block truncate text-ink-soft" title={itemsSummary(b)}>
                      {itemsSummary(b)}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right font-mono font-semibold`}>{formatGBP(b.total)}</td>
                  <td className={tdClass}>
                    <BookingStatusBadge status={b.status} size="sm" />
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(b.id)
                      }}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )
      )}

      {/* Detail drawer */}
      <SlideOver
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? selected.customer_name : 'Booking'}
        description={selected ? selected.reference : undefined}
        footer={
          selected ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              {selected.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => void changeStatus(selected.id, 'confirmed')}
                  disabled={busyStatus}
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Confirm
                </Button>
              )}
              {selected.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => void changeStatus(selected.id, 'completed')}
                  disabled={busyStatus}
                  leftIcon={<CircleCheck className="h-4 w-4" />}
                >
                  Mark complete
                </Button>
              )}
              {(selected.status === 'pending' || selected.status === 'confirmed') && (
                <DangerButton onClick={() => setConfirmCancel(true)} disabled={busyStatus}>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </DangerButton>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center justify-between">
              <BookingStatusBadge status={selected.status} />
              <span className="text-ink-soft">Booked {formatDate(selected.created_at)}</span>
            </div>

            {selected.status === 'confirmed' && (
              <NotifyCustomerPanel
                booking={selected}
                notifying={notifying}
                onResend={() => void notifyCustomer(selected.id)}
              />
            )}

            <DetailSection title="Appointment">
              <DetailRow label="Date" value={formatDate(selected.service_date)} />
              <DetailRow label="Time" value={formatTime(selected.start_time)} mono />
              <DetailRow label="Duration" value={formatDuration(selected.duration_minutes)} />
              <DetailRow label="Frequency" value={selected.frequency || '-'} />
              <DetailRow label="Property band" value={selected.property_band || '-'} />
            </DetailSection>

            <DetailSection title="Customer">
              <DetailRow label="Name" value={selected.customer_name} />
              <DetailRow
                label="Email"
                value={
                  <a className="text-teal-deep hover:text-ink" href={`mailto:${selected.email}`}>
                    {selected.email}
                  </a>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  selected.phone ? (
                    <a className="text-teal-deep hover:text-ink" href={`tel:${selected.phone.replace(/\s/g, '')}`}>
                      {selected.phone}
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
            </DetailSection>

            <DetailSection title="Address">
              <address className="not-italic leading-relaxed text-ink">
                {[
                  selected.address_line1,
                  selected.address_line2,
                  selected.city,
                  selected.postcode,
                  selected.area_name,
                ]
                  .filter(Boolean)
                  .map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
              </address>
            </DetailSection>

            <DetailSection title="Services">
              <ul className="divide-y divide-pane rounded-lg border border-pane">
                {selected.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-ink">{item.name}</span>
                    <span className="font-mono text-ink-soft">{formatGBP(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5">
                <PriceLine label="Subtotal" value={selected.subtotal} />
                {selected.discount_amount > 0 && (
                  <PriceLine label="Bundle discount" value={-selected.discount_amount} />
                )}
                {selected.surcharge_amount > 0 && (
                  <PriceLine label="Area surcharge" value={selected.surcharge_amount} />
                )}
                <PriceLine label="Total" value={selected.total} strong />
              </dl>
            </DetailSection>

            {selected.customer_notes && (
              <DetailSection title="Customer notes">
                <p className="whitespace-pre-wrap text-ink">{selected.customer_notes}</p>
              </DetailSection>
            )}

            <div>
              <Textarea
                label="Admin notes"
                rows={4}
                placeholder="Private notes for the team (not shown to the customer)."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void saveNotes(selected.id)}
                  disabled={savingNotes || notes === selected.admin_notes}
                  leftIcon={savingNotes ? <Spinner size={16} className="text-teal-deep" /> : undefined}
                >
                  {savingNotes ? 'Saving…' : 'Save notes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this booking?"
        message="The booking will be marked as cancelled. This frees up the slot and can't be undone from here."
        confirmLabel="Cancel booking"
        cancelLabel="Keep it"
        busy={busyStatus}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => selected && void changeStatus(selected.id, 'cancelled')}
      />
    </div>
  )
}

function NotifyCustomerPanel({
  booking,
  notifying,
  onResend,
}: {
  booking: Booking
  notifying: boolean
  onResend: () => void
}) {
  const emailLink = buildConfirmationEmailLink(booking)
  const smsLink = buildConfirmationSmsLink(booking)
  return (
    <section className="rounded-card border border-pane bg-paper/70 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Notify the customer</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
        Each button opens a ready-made confirmation in your own mail or messages app, so you can
        read it over and press send.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          href={emailLink}
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
        >
          Email confirmation
        </Button>
        {smsLink && (
          <Button
            variant="secondary"
            size="sm"
            href={smsLink}
            leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
          >
            Text confirmation
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-pane/70 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onResend}
          disabled={notifying}
          leftIcon={
            notifying ? (
              <Spinner size={16} className="text-teal-deep" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )
          }
        >
          {notifying ? 'Sending…' : 'Resend confirmation email'}
        </Button>
        <p className="text-xs text-ink-soft">Sends the automatic email again, if it is set up.</p>
      </div>
    </section>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{title}</h3>
      {children}
    </section>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-ink-soft">{label}</span>
      <span className={mono ? 'font-mono text-ink' : 'text-right text-ink'}>{value}</span>
    </div>
  )
}

function PriceLine({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t border-pane pt-1.5 font-semibold text-ink' : 'text-ink-soft'}`}>
      <dt>{label}</dt>
      <dd className="font-mono">{formatGBP(value)}</dd>
    </div>
  )
}
