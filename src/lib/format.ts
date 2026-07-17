// Formatting helpers. British English, £ sterling, UK date/time.

/** £ with 2dp, but drop a trailing .00 (e.g. £15, £15.50, £1,234.50). */
export function formatGBP(n: number): string {
  const value = Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
  const hasPence = Math.round(value * 100) % 100 !== 0
  return (
    '£' +
    value.toLocaleString('en-GB', {
      minimumFractionDigits: hasPence ? 2 : 0,
      maximumFractionDigits: 2,
    })
  )
}

/** Parse 'YYYY-MM-DD' (or a Date) into a local Date, avoiding UTC day-shift. */
function toLocalDate(input: string | Date): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  if (match) {
    const [, y, m, d] = match
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  const parsed = new Date(input)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Friendly UK date, e.g. "Mon 21 July 2026". Pass Intl options to override. */
export function formatDate(
  input: string | Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  const date = toLocalDate(input)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB', options).format(date)
}

/** 24h 'HH:MM[:SS]' -> friendly 12h, e.g. "8:00 am", "5:30 pm". */
export function formatTime(input: string): string {
  const parts = input.split(':')
  const hour = Number(parts[0])
  const minute = Number(parts[1] ?? '0')
  if (Number.isNaN(hour)) return input
  const period = hour < 12 ? 'am' : 'pm'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${String(Number.isNaN(minute) ? 0 : minute).padStart(2, '0')} ${period}`
}

/** Minutes -> "1 hr 30 min" / "45 min" / "2 hr". */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  const hrs = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  const bits: string[] = []
  if (hrs > 0) bits.push(`${hrs} hr`)
  if (mins > 0) bits.push(`${mins} min`)
  return bits.join(' ')
}
