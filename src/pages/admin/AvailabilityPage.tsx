import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { cn } from '../../lib/cn'
import { formatDate, formatTime } from '../../lib/format'
import type { BusinessHours } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { fieldBase, fieldNormal } from '../../components/ui/field'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states'
import {
  AdminHeading,
  ConfirmDialog,
  DangerButton,
  Switch,
  TableCard,
  tdClass,
  thClass,
  useToast,
} from '../../components/admin/primitives'
import {
  createBlockedSlot,
  deleteBlockedSlot,
  fetchBlockedSlots,
  fetchBusinessHoursAdmin,
  todayISO,
  toTimeInput,
  upsertBusinessHours,
  type BlockedSlot,
} from '../../components/admin/data'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

interface AvailabilityData {
  hours: BusinessHours[]
  blocked: BlockedSlot[]
}

interface HoursRow {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

const timeInput = cn(fieldBase, fieldNormal, 'px-2.5 py-1.5 font-mono text-sm')

export default function AvailabilityPage() {
  const { data, loading, error, reload } = useAsync<AvailabilityData>(async () => {
    const [hours, blocked] = await Promise.all([fetchBusinessHoursAdmin(), fetchBlockedSlots()])
    return { hours, blocked }
  }, [])

  return (
    <div className="space-y-10">
      <AdminHeading title="Availability" description="Your weekly opening hours and any one-off blocked time." />

      {loading && <LoadingState message="Loading availability…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        <>
          <BusinessHoursEditor hours={data.hours} onSaved={reload} />
          <BlockedSlotsEditor blocked={data.blocked} onSaved={reload} />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Business hours
// ---------------------------------------------------------------------------
function BusinessHoursEditor({ hours, onSaved }: { hours: BusinessHours[]; onSaved: () => void }) {
  const toast = useToast()

  const initial = useMemo<HoursRow[]>(() => {
    const byDay = new Map(hours.map((h) => [h.day_of_week, h]))
    return DISPLAY_ORDER.map((day) => {
      const row = byDay.get(day)
      return {
        day_of_week: day,
        is_open: row?.is_open ?? false,
        open_time: toTimeInput(row?.open_time),
        close_time: toTimeInput(row?.close_time),
      }
    })
  }, [hours])

  const [draft, setDraft] = useState<HoursRow[]>(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(initial), [initial])

  function update(day: number, patch: Partial<HoursRow>) {
    setDraft((rows) => rows.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r)))
  }

  async function save() {
    for (const row of draft) {
      if (row.is_open && (!row.open_time || !row.close_time)) {
        toast.show(`${DAY_NAMES[row.day_of_week]}: set both open and close times.`, 'error')
        return
      }
      if (row.is_open && row.open_time >= row.close_time) {
        toast.show(`${DAY_NAMES[row.day_of_week]}: close time must be after open time.`, 'error')
        return
      }
    }
    const payload: BusinessHours[] = draft.map((row) => ({
      day_of_week: row.day_of_week,
      is_open: row.is_open,
      open_time: row.is_open ? row.open_time : null,
      close_time: row.is_open ? row.close_time : null,
    }))
    setSaving(true)
    try {
      await upsertBusinessHours(payload)
      toast.show('Opening hours saved.')
      onSaved()
    } catch {
      toast.show('Could not save hours. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Opening hours</h2>
          <p className="text-sm text-ink-soft">When the booking tool offers slots.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void save()}
          disabled={saving}
          leftIcon={saving ? <Spinner size={16} className="text-teal-deep" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save hours'}
        </Button>
      </div>
      <TableCard minWidth={520}>
        <thead>
          <tr className="border-b border-pane bg-pane/30">
            <th className={thClass}>Day</th>
            <th className={thClass}>Open</th>
            <th className={thClass}>From</th>
            <th className={thClass}>To</th>
          </tr>
        </thead>
        <tbody>
          {draft.map((row) => (
            <tr key={row.day_of_week} className="border-b border-pane/60 last:border-0">
              <td className={`${tdClass} font-semibold`}>{DAY_NAMES[row.day_of_week]}</td>
              <td className={tdClass}>
                <Switch
                  checked={row.is_open}
                  onChange={(v) => update(row.day_of_week, { is_open: v })}
                  label={`${DAY_NAMES[row.day_of_week]} open`}
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="time"
                  aria-label={`${DAY_NAMES[row.day_of_week]} open time`}
                  className={timeInput}
                  disabled={!row.is_open}
                  value={row.open_time}
                  onChange={(e) => update(row.day_of_week, { open_time: e.target.value })}
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="time"
                  aria-label={`${DAY_NAMES[row.day_of_week]} close time`}
                  className={timeInput}
                  disabled={!row.is_open}
                  value={row.close_time}
                  onChange={(e) => update(row.day_of_week, { close_time: e.target.value })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Blocked slots
// ---------------------------------------------------------------------------
function BlockedSlotsEditor({ blocked, onSaved }: { blocked: BlockedSlot[]; onSaved: () => void }) {
  const toast = useToast()
  const today = todayISO()
  const upcoming = useMemo(() => blocked.filter((b) => b.date >= today), [blocked, today])

  const [date, setDate] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<BlockedSlot | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function add() {
    if (!date) {
      toast.show('Pick a date to block.', 'error')
      return
    }
    if (start >= end) {
      toast.show('End time must be after start time.', 'error')
      return
    }
    setAdding(true)
    try {
      await createBlockedSlot({ date, start_time: start, end_time: end, reason: reason.trim() })
      toast.show('Time blocked.')
      setDate('')
      setReason('')
      onSaved()
    } catch {
      toast.show('Could not block that time. Try again.', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteBlockedSlot(toDelete.id)
      toast.show('Block removed.')
      onSaved()
    } catch {
      toast.show('Could not remove the block.', 'error')
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Blocked time</h2>
        <p className="text-sm text-ink-soft">One-off dates and times to keep free (holidays, appointments).</p>
      </div>

      {/* Add form */}
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-dashed border-ink/15 p-4">
        <Input label="Date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        <Input label="From" type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-32" />
        <Input label="To" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-32" />
        <div className="min-w-[10rem] flex-1">
          <Input label="Reason" placeholder="Optional" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button
          size="sm"
          onClick={() => void add()}
          disabled={adding}
          leftIcon={adding ? <Spinner size={16} className="text-ink" /> : <Plus className="h-4 w-4" />}
        >
          {adding ? 'Blocking…' : 'Block time'}
        </Button>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-6 w-6" />}
          title="No upcoming blocks"
          body="Block a date above to keep it free in the booking tool."
        />
      ) : (
        <TableCard minWidth={560}>
          <thead>
            <tr className="border-b border-pane bg-pane/30">
              <th className={thClass}>Date</th>
              <th className={thClass}>Time</th>
              <th className={thClass}>Reason</th>
              <th className={`${thClass} text-right`}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((slot) => (
              <tr key={slot.id} className="border-b border-pane/60 last:border-0 hover:bg-pane/15">
                <td className={`${tdClass} font-medium`}>{formatDate(slot.date)}</td>
                <td className={`${tdClass} font-mono text-xs`}>
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </td>
                <td className={tdClass}>{slot.reason || <span className="text-ink-soft">—</span>}</td>
                <td className={`${tdClass} text-right`}>
                  <DangerButton onClick={() => setToDelete(slot)} aria-label="Remove block">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </DangerButton>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove this block?"
        message="The slot will become available for bookings again."
        confirmLabel="Remove"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  )
}
