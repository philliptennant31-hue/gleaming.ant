import { describe, expect, it } from 'vitest'
import { dayOfWeek, generateSlots, listSelectableDates, minutesToTime, timeToMinutes } from '../availability'
import type { BusinessHours, UnavailableSlot } from '../types'

// ---------------------------------------------------------------------------
// Fixtures — business hours mirror the seed (0 = Sunday). Dates chosen for
// their known weekdays:
//   2026-07-17 Fri | 2026-07-18 Sat | 2026-07-19 Sun | 2026-07-20 Mon
// `now` is always injected so the tests are deterministic and TZ-safe (every
// value is constructed and compared in local time).
// ---------------------------------------------------------------------------

const hours: BusinessHours[] = [
  { day_of_week: 0, is_open: false, open_time: null, close_time: null }, // Sunday
  { day_of_week: 1, is_open: true, open_time: '08:00', close_time: '17:00' },
  { day_of_week: 2, is_open: true, open_time: '08:00', close_time: '17:00' },
  { day_of_week: 3, is_open: true, open_time: '08:00', close_time: '17:00' },
  { day_of_week: 4, is_open: true, open_time: '08:00', close_time: '17:00' },
  { day_of_week: 5, is_open: true, open_time: '08:00', close_time: '17:00' },
  { day_of_week: 6, is_open: true, open_time: '09:00', close_time: '14:00' }, // Saturday
]

const NO_BLOCKS: UnavailableSlot[] = []
const FRI_9AM = new Date(2026, 6, 17, 9, 0, 0) // Friday 17 July 2026, 09:00 local

describe('time helpers', () => {
  it('convert between HH:MM and minutes', () => {
    expect(timeToMinutes('08:00')).toBe(480)
    expect(timeToMinutes('17:30')).toBe(1050)
    expect(timeToMinutes('09:00:00')).toBe(540)
    expect(minutesToTime(480)).toBe('08:00')
    expect(minutesToTime(1050)).toBe('17:30')
  })

  it('reports day of week with 0 = Sunday', () => {
    expect(dayOfWeek('2026-07-19')).toBe(0) // Sunday
    expect(dayOfWeek('2026-07-20')).toBe(1) // Monday
    expect(dayOfWeek('2026-07-18')).toBe(6) // Saturday
  })
})

describe('generateSlots — open day', () => {
  it('steps from open to the last slot that fits before close', () => {
    const slots = generateSlots({
      date: '2026-07-20', // Monday 08:00–17:00
      hours,
      unavailable: NO_BLOCKS,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      now: FRI_9AM,
    })
    // 08:00 … 16:00 inclusive, every 30 min. 16:30 would end 17:15 > close.
    expect(slots).toHaveLength(17)
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('16:00')
    expect(slots).not.toContain('16:30')
  })
})

describe('generateSlots — duration must fit before close', () => {
  it('keeps a slot whose job ends exactly at close', () => {
    const slots = generateSlots({
      date: '2026-07-18', // Saturday 09:00–14:00 (300 min window)
      hours,
      unavailable: NO_BLOCKS,
      durationMinutes: 300,
      intervalMinutes: 30,
      minNoticeHours: 24,
      now: FRI_9AM,
    })
    expect(slots).toEqual(['09:00']) // 09:00 + 5h = 14:00, exactly close
  })

  it('returns nothing when the job cannot fit before close', () => {
    const slots = generateSlots({
      date: '2026-07-18', // Saturday, 300-min window
      hours,
      unavailable: NO_BLOCKS,
      durationMinutes: 330, // 5h30 — overflows close
      intervalMinutes: 30,
      minNoticeHours: 24,
      now: FRI_9AM,
    })
    expect(slots).toEqual([])
  })
})

describe('generateSlots — closed day', () => {
  it('returns no slots on a closed day (Sunday)', () => {
    const slots = generateSlots({
      date: '2026-07-19', // Sunday
      hours,
      unavailable: NO_BLOCKS,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      now: FRI_9AM,
    })
    expect(slots).toEqual([])
  })
})

describe('generateSlots — overlap trimming', () => {
  it('drops slots that overlap an unavailable range but keeps adjacent ones', () => {
    const unavailable: UnavailableSlot[] = [
      { on_date: '2026-07-20', start_time: '10:00', end_time: '11:00' },
      { on_date: '2026-07-21', start_time: '08:00', end_time: '17:00' }, // different day — ignored
    ]
    const slots = generateSlots({
      date: '2026-07-20', // Monday
      hours,
      unavailable,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      now: FRI_9AM,
    })
    // 09:30 [–10:15], 10:00, 10:30 clash with 10:00–11:00 and are removed.
    expect(slots).not.toContain('09:30')
    expect(slots).not.toContain('10:00')
    expect(slots).not.toContain('10:30')
    // 09:00 [–09:45] and 11:00 [–11:45] sit flush against the block — kept.
    expect(slots).toContain('09:00')
    expect(slots).toContain('11:00')
    expect(slots).toHaveLength(14) // 17 − 3
  })
})

describe('generateSlots — minimum notice', () => {
  it('excludes slots inside the notice window later today', () => {
    const slots = generateSlots({
      date: '2026-07-20',
      hours,
      unavailable: NO_BLOCKS,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 2,
      now: new Date(2026, 6, 20, 7, 0, 0), // Monday 07:00 → earliest 09:00
    })
    expect(slots).not.toContain('08:00')
    expect(slots).not.toContain('08:30')
    expect(slots[0]).toBe('09:00') // exactly on the notice boundary — allowed
  })

  it('leaves no slots today when the whole day is inside the notice window', () => {
    const slots = generateSlots({
      date: '2026-07-20',
      hours,
      unavailable: NO_BLOCKS,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      now: new Date(2026, 6, 20, 9, 0, 0), // Monday 09:00 → earliest next day
    })
    expect(slots).toEqual([])
  })
})

describe('listSelectableDates', () => {
  it('returns open days with slots, skipping today (notice) and closed Sundays', () => {
    const dates = listSelectableDates({
      hours,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      maxDaysAhead: 7,
      now: FRI_9AM, // Friday 17 July
    })
    // Horizon 17–24 July. 17 (today) excluded by notice; 19 (Sun) closed.
    expect(dates).toEqual(['2026-07-18', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24'])
  })

  it('respects the horizon — nothing bookable when only today is in range under notice', () => {
    const dates = listSelectableDates({
      hours,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      maxDaysAhead: 0, // only today, which the 24h notice rules out
      now: FRI_9AM,
    })
    expect(dates).toEqual([])
  })

  it('drops a day whose entire open window is blocked', () => {
    const unavailable: UnavailableSlot[] = [
      { on_date: '2026-07-20', start_time: '08:00', end_time: '17:00' }, // whole Monday blocked
    ]
    const dates = listSelectableDates({
      hours,
      durationMinutes: 45,
      intervalMinutes: 30,
      minNoticeHours: 24,
      maxDaysAhead: 3, // 17–20 July
      unavailable,
      now: FRI_9AM,
    })
    expect(dates).toContain('2026-07-18') // Saturday still open
    expect(dates).not.toContain('2026-07-20') // fully blocked
    expect(dates).not.toContain('2026-07-19') // Sunday closed
  })
})
