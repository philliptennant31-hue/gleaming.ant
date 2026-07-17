import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../lib/useAsync'
import { formatDate, formatTime } from '../../lib/format'
import { generateSlots, listSelectableDates } from '../../lib/availability'
import type { BusinessHours, UnavailableSlot } from '../../lib/types'
import { LoadingState, ErrorState, EmptyState } from '../ui/states'
import { StepHeader } from './StepHeader'

interface StepDateTimeProps {
  hours: BusinessHours[]
  intervalMinutes: number
  minNoticeHours: number
  maxDaysAhead: number
  durationMinutes: number
  date: string
  time: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  errors: { date?: string; time?: string }
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function StepDateTime({
  hours,
  intervalMinutes,
  minNoticeHours,
  maxDaysAhead,
  durationMinutes,
  date,
  time,
  onDateChange,
  onTimeChange,
  errors,
}: StepDateTimeProps) {
  // Stable "now" for the lifetime of this step so date maths doesn't drift.
  const [now] = useState(() => new Date())

  const fromDate = isoDate(now)
  const toDate = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + maxDaysAhead))

  const { data, loading, error, reload } = useAsync<UnavailableSlot[]>(async () => {
    const { data: rows, error: rpcError } = await supabase.rpc('get_unavailable_slots', {
      from_date: fromDate,
      to_date: toDate,
    })
    if (rpcError) throw rpcError
    return (rows ?? []) as UnavailableSlot[]
  }, [fromDate, toDate])

  const unavailable = useMemo(() => data ?? [], [data])

  const selectableDates = useMemo(
    () =>
      listSelectableDates({
        hours,
        durationMinutes,
        intervalMinutes,
        minNoticeHours,
        maxDaysAhead,
        unavailable,
        now,
      }),
    [hours, durationMinutes, intervalMinutes, minNoticeHours, maxDaysAhead, unavailable, now],
  )

  const slots = useMemo(
    () =>
      date
        ? generateSlots({ date, hours, unavailable, durationMinutes, intervalMinutes, minNoticeHours, now })
        : [],
    [date, hours, unavailable, durationMinutes, intervalMinutes, minNoticeHours, now],
  )

  // Keep selection valid as availability changes (e.g. services edited).
  useEffect(() => {
    if (loading || error) return
    if (date && !selectableDates.includes(date)) {
      onDateChange('')
      onTimeChange('')
    }
  }, [loading, error, date, selectableDates, onDateChange, onTimeChange])

  useEffect(() => {
    if (loading || error) return
    if (time && !slots.includes(time)) onTimeChange('')
  }, [loading, error, time, slots, onTimeChange])

  return (
    <div>
      <StepHeader
        title="Pick a day and time"
        lead="Choose a slot that suits you. We'll confirm it by message before we head over."
      />

      {(errors.date || errors.time) && (
        <p role="alert" className="mb-4 flex items-center gap-2 text-sm font-medium text-danger">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {errors.date ?? errors.time}
        </p>
      )}

      {loading && <LoadingState message="Loading available times…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && (
        <>
          {selectableDates.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No times to show just now"
              body="We couldn't find an open slot in the next few weeks. Send us a message and we'll sort a time that works."
            />
          ) : (
            <>
              <fieldset>
                <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                  <CalendarDays className="h-4 w-4 text-teal-deep" aria-hidden="true" />
                  Choose a day
                </legend>
                <div
                  className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
                  role="radiogroup"
                  aria-label="Available days"
                >
                  {selectableDates.map((d) => {
                    const selected = d === date
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          onDateChange(d)
                          onTimeChange('')
                        }}
                        className={cn(
                          'flex flex-col items-center rounded-xl border px-2 py-2.5 transition-[border-color,background-color]',
                          selected
                            ? 'border-teal bg-teal/10 text-teal-deep'
                            : 'border-pane bg-white text-ink hover:border-teal/50',
                        )}
                      >
                        <span className="text-xs font-medium text-ink-soft">
                          {formatDate(d, { weekday: 'short' })}
                        </span>
                        <span className="font-display text-xl font-bold leading-tight">
                          {formatDate(d, { day: 'numeric' })}
                        </span>
                        <span className="text-xs text-ink-soft">{formatDate(d, { month: 'short' })}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {date && (
                <fieldset className="mt-8">
                  <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                    <Clock className="h-4 w-4 text-teal-deep" aria-hidden="true" />
                    Choose a time on {formatDate(date)}
                  </legend>
                  {slots.length === 0 ? (
                    <p className="text-sm text-ink-soft">
                      No times left on that day — try another.
                    </p>
                  ) : (
                    <div
                      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                      role="radiogroup"
                      aria-label="Available times"
                    >
                      {slots.map((slot) => {
                        const selected = slot === time
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onTimeChange(slot)}
                            className={cn(
                              'rounded-xl border px-2 py-2.5 text-center font-mono text-sm transition-[border-color,background-color]',
                              selected
                                ? 'border-teal bg-teal/10 font-semibold text-teal-deep'
                                : 'border-pane bg-white text-ink hover:border-teal/50',
                            )}
                          >
                            {formatTime(slot)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </fieldset>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default StepDateTime
