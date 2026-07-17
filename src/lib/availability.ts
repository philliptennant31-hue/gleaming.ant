// Availability engine — PURE functions only (no supabase, no React, no I/O).
// Slot generation from business hours + settings, honouring duration, blocked
// ranges, minimum notice and the booking horizon. Fully unit-tested in
// src/lib/__tests__/availability.test.ts.

import type { BusinessHours, UnavailableSlot } from './types'

const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 3_600_000

/** 'HH:MM[:SS]' → minutes since midnight. Returns NaN for unparseable input. */
export function timeToMinutes(time: string): number {
  const parts = time.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1] ?? '0')
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/** Minutes since midnight → zero-padded 'HH:MM'. */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Parse 'YYYY-MM-DD' as a LOCAL midnight Date (no UTC day-shift). */
function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Local calendar date string for a Date, 'YYYY-MM-DD'. */
function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Day of week for a 'YYYY-MM-DD' string, 0 = Sunday (matches business_hours). */
export function dayOfWeek(date: string): number {
  return parseLocalDate(date).getDay()
}

/** Local Date at `mins` past midnight on `date`. */
function dateAtMinutes(date: string, mins: number): Date {
  return new Date(parseLocalDate(date).getTime() + mins * MS_PER_MINUTE)
}

export interface SlotParams {
  /** Target day, 'YYYY-MM-DD'. */
  date: string
  /** All business_hours rows (0 = Sunday). */
  hours: BusinessHours[]
  /** Unavailable ranges (get_unavailable_slots + blocked_slots); any date — filtered here. */
  unavailable: UnavailableSlot[]
  /** Total job duration in minutes (must fit before close). */
  durationMinutes: number
  /** Slot step in minutes (settings.booking.slot_interval_minutes). */
  intervalMinutes: number
  /** Minimum lead time in hours from `now` (settings.booking.min_notice_hours). */
  minNoticeHours: number
  /** Injected for deterministic tests; defaults to the real clock. */
  now?: Date
}

/**
 * Generate the bookable start times ('HH:MM') for a single date.
 * A slot is kept when: the business is open that day; the whole job
 * [start, start+duration] finishes on or before close; the slot starts at or
 * after `now + minNoticeHours`; and it overlaps no unavailable range.
 */
export function generateSlots(params: SlotParams): string[] {
  const {
    date,
    hours,
    unavailable,
    durationMinutes,
    intervalMinutes,
    minNoticeHours,
    now = new Date(),
  } = params

  if (!(durationMinutes > 0)) return []
  const interval = intervalMinutes > 0 ? intervalMinutes : 30

  const bh = hours.find((h) => h.day_of_week === dayOfWeek(date))
  if (!bh || !bh.is_open || !bh.open_time || !bh.close_time) return []

  const open = timeToMinutes(bh.open_time)
  const close = timeToMinutes(bh.close_time)
  if (Number.isNaN(open) || Number.isNaN(close) || close <= open) return []

  const earliest = new Date(now.getTime() + minNoticeHours * MS_PER_HOUR)

  const blocks = unavailable
    .filter((u) => u.on_date === date)
    .map((u) => ({ start: timeToMinutes(u.start_time), end: timeToMinutes(u.end_time) }))
    .filter((b) => !Number.isNaN(b.start) && !Number.isNaN(b.end))

  const slots: string[] = []
  for (let start = open; start + durationMinutes <= close; start += interval) {
    const end = start + durationMinutes

    // Respect minimum notice.
    if (dateAtMinutes(date, start) < earliest) continue

    // Half-open overlap test: [start, end) vs [b.start, b.end).
    const clashes = blocks.some((b) => start < b.end && end > b.start)
    if (clashes) continue

    slots.push(minutesToTime(start))
  }
  return slots
}

export interface SelectableDatesParams {
  hours: BusinessHours[]
  durationMinutes: number
  intervalMinutes: number
  minNoticeHours: number
  /** Horizon in days from today (settings.booking.max_days_ahead), inclusive. */
  maxDaysAhead: number
  /** Blocked/booked ranges across the horizon; used to drop fully-blocked days. */
  unavailable?: UnavailableSlot[]
  now?: Date
}

/**
 * List the dates ('YYYY-MM-DD') within the horizon that have at least one
 * bookable slot. Naturally excludes closed days, days ruled out by the notice
 * window (e.g. the rest of today), and any day whose slots are all blocked.
 */
export function listSelectableDates(params: SelectableDatesParams): string[] {
  const {
    hours,
    durationMinutes,
    intervalMinutes,
    minNoticeHours,
    maxDaysAhead,
    unavailable = [],
    now = new Date(),
  } = params

  const dates: string[] = []
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (let i = 0; i <= maxDaysAhead; i++) {
    // Construct via calendar parts so month/year/DST roll over correctly.
    const day = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + i)
    const iso = toISODate(day)
    const slots = generateSlots({
      date: iso,
      hours,
      unavailable,
      durationMinutes,
      intervalMinutes,
      minNoticeHours,
      now,
    })
    if (slots.length > 0) dates.push(iso)
  }
  return dates
}
