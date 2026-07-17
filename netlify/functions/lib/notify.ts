// Booking confirmation email: builder + Resend sender.
//
// Self-contained on purpose: no imports from src/ or from the other function
// libs (concurrent phases own those files). The formatters mirror
// src/lib/format.ts so the automatic email matches what the admin drawer and
// the manual mailto: prefill show.
//
// Sending is strictly tiered:
//   - no RESEND_API_KEY            -> { sent: false, reason: 'not_configured' }
//   - Resend error / timeout       -> { sent: false, reason: 'send_failed' }
//   - booking has no email address -> { sent: false, reason: 'no_email' }
//   - accepted by Resend           -> { sent: true, email }
// Configuration problems are never a thrown error or a 500; the admin UI shows
// the manual buttons either way.

export interface NotifyBookingItem {
  name: string
  line_total: number
}

export interface NotifyBooking {
  id: string
  reference: string
  customer_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  postcode: string
  service_date: string
  start_time: string
  items: NotifyBookingItem[]
  subtotal: number
  discount_amount: number
  surcharge_amount: number
  total: number
}

export type NotifySendResult =
  | { sent: true; email: string }
  | { sent: false; reason: 'not_configured' | 'send_failed' | 'no_email' }

export interface ConfirmationEmail {
  subject: string
  html: string
  text: string
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

// ---------------------------------------------------------------------------
// Formatters (server-side mirrors of src/lib/format.ts)
// ---------------------------------------------------------------------------

/** £ with 2dp, dropping a trailing .00 (e.g. £15, £15.50, £1,234.50). */
function formatGBP(n: number): string {
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

/** 'YYYY-MM-DD' -> "Fri 24 July 2026" (UTC-pinned so the server TZ is irrelevant). */
function formatDateGB(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  const [, y, m, d] = match
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** 24h 'HH:MM[:SS]' -> "8:30 am" / "5:00 pm". */
function formatTimeGB(input: string): string {
  const parts = input.split(':')
  const hour = Number(parts[0])
  const minute = Number(parts[1] ?? '0')
  if (Number.isNaN(hour)) return input
  const period = hour < 12 ? 'am' : 'pm'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${String(Number.isNaN(minute) ? 0 : minute).padStart(2, '0')} ${period}`
}

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0]
  return first || 'there'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------------------

// Brand tokens from src/index.css, inlined because email clients ignore CSS vars.
const INK = '#22414f'
const INK_SOFT = '#48626e'
const TEAL_DEEP = '#2e655e'
const PANE = '#c9e5e2'
const PAPER = '#f6faf9'
const AMBER = '#e0913d'

const FONT = 'Arial,Helvetica,sans-serif'
const MONO = "'Courier New',Courier,monospace"
const P_STYLE = `margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};`

function detailRow(label: string, value: string): string {
  return (
    '<tr>' +
    `<td style="padding:6px 16px 6px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${INK_SOFT};vertical-align:top;white-space:nowrap;">${label}</td>` +
    `<td align="right" style="padding:6px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${INK};vertical-align:top;">${value}</td>` +
    '</tr>'
  )
}

function priceRow(label: string, value: string, options?: { soft?: boolean; total?: boolean }): string {
  const colour = options?.soft ? INK_SOFT : INK
  const weight = options?.total ? 'bold' : 'normal'
  const border = options?.total ? `border-top:1px solid ${PANE};` : ''
  return (
    '<tr>' +
    `<td style="padding:6px 16px 6px 0;${border}font-family:${FONT};font-size:14px;line-height:1.5;color:${colour};font-weight:${weight};">${label}</td>` +
    `<td align="right" style="padding:6px 0;${border}font-family:${MONO};font-size:14px;line-height:1.5;color:${colour};font-weight:${weight};white-space:nowrap;">${value}</td>` +
    '</tr>'
  )
}

/**
 * Build the branded confirmation email (subject + HTML + plain text) from real
 * booking data. Inline styles only; all customer-supplied values are escaped.
 */
export function buildConfirmationEmail(booking: NotifyBooking): ConfirmationEmail {
  const subject = `Your Gleaming Ant booking is confirmed (${booking.reference})`

  const date = formatDateGB(booking.service_date)
  const time = formatTimeGB(booking.start_time)
  const name = firstName(booking.customer_name)
  const address = [booking.address_line1, booking.address_line2, booking.city, booking.postcode]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(', ')
  const items = (booking.items ?? []).filter((item) => item && item.name)
  const hasAdjustments = booking.discount_amount > 0 || booking.surcharge_amount > 0

  // ----- plain text part -----
  const textLines: string[] = [
    `Hi ${name},`,
    '',
    'Good news, your booking is confirmed.',
    '',
    `Reference: ${booking.reference}`,
    `Date: ${date}`,
    `Time: ${time}`,
  ]
  if (address) textLines.push(`Address: ${address}`)
  textLines.push('', 'Services:')
  for (const item of items) {
    textLines.push(`- ${item.name}: ${formatGBP(item.line_total)}`)
  }
  if (items.length === 0) textLines.push('- As agreed when you booked')
  if (hasAdjustments) {
    textLines.push(`Subtotal: ${formatGBP(booking.subtotal)}`)
    if (booking.discount_amount > 0) textLines.push(`Bundle discount: -${formatGBP(booking.discount_amount)}`)
    if (booking.surcharge_amount > 0) textLines.push(`Area surcharge: ${formatGBP(booking.surcharge_amount)}`)
  }
  textLines.push(
    `Total: ${formatGBP(booking.total)}`,
    '',
    'Nothing else is needed from you, we will see you on the day.',
    'If anything needs changing, just reply to this email and we will sort it.',
    '',
    'See you soon,',
    'The Gleaming Ant team',
  )
  const text = textLines.join('\n')

  // ----- HTML part -----
  const itemRows = items
    .map((item) => priceRow(escapeHtml(item.name), formatGBP(item.line_total)))
    .join('')
  const adjustmentRows = hasAdjustments
    ? priceRow('Subtotal', formatGBP(booking.subtotal), { soft: true }) +
      (booking.discount_amount > 0
        ? priceRow('Bundle discount', `-${formatGBP(booking.discount_amount)}`, { soft: true })
        : '') +
      (booking.surcharge_amount > 0
        ? priceRow('Area surcharge', formatGBP(booking.surcharge_amount), { soft: true })
        : '')
    : ''
  const totalRow = priceRow('Total', formatGBP(booking.total), { total: true })

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<body style="margin:0;padding:0;background-color:${PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Confirmed for ${escapeHtml(date)} at ${escapeHtml(time)}. Your reference is ${escapeHtml(booking.reference)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
          <tr>
            <td style="background-color:${TEAL_DEEP};border-radius:12px 12px 0 0;padding:22px 28px;">
              <div style="font-family:${FONT};font-size:22px;font-weight:bold;color:#ffffff;">Gleaming Ant</div>
              <div style="font-family:${FONT};font-size:13px;color:${PANE};padding-top:2px;">Window and exterior cleaning, Essex</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid ${PANE};border-top:0;border-radius:0 0 12px 12px;padding:28px;">
              <p style="${P_STYLE}">Hi ${escapeHtml(name)},</p>
              <p style="${P_STYLE}">Good news, your booking is confirmed. Here is everything in one place.</p>
              <p style="margin:0 0 20px;">
                <span style="display:inline-block;background-color:${AMBER};color:${INK};font-family:${MONO};font-size:15px;font-weight:bold;letter-spacing:1px;padding:6px 12px;border-radius:8px;">${escapeHtml(booking.reference)}</span>
              </p>
              <div style="font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${INK_SOFT};padding-bottom:4px;">Booking details</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${PANE};border-bottom:1px solid ${PANE};margin:0 0 18px;">
                ${detailRow('Date', escapeHtml(date))}
                ${detailRow('Time', escapeHtml(time))}
                ${address ? detailRow('Address', escapeHtml(address)) : ''}
              </table>
              <div style="font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${INK_SOFT};padding-bottom:4px;">Your services</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${PANE};border-bottom:1px solid ${PANE};margin:0 0 20px;">
                ${itemRows}
                ${adjustmentRows}
                ${totalRow}
              </table>
              <p style="${P_STYLE}">Nothing else is needed from you, we will see you on the day.</p>
              <p style="${P_STYLE}">If anything needs changing, just reply to this email and we will sort it.</p>
              <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};">See you soon,<br>The Gleaming Ant team</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 8px;">
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;color:${INK_SOFT};">Gleaming Ant, window and exterior cleaning across Essex. Booking reference ${escapeHtml(booking.reference)}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// Resend sender
// ---------------------------------------------------------------------------

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SEND_TIMEOUT_MS = 10_000
const DEFAULT_FROM = 'Gleaming Ant <onboarding@resend.dev>'

/**
 * Send the confirmation email via Resend, if a key is configured. Never throws:
 * every failure mode maps to a typed { sent: false } result so the endpoint can
 * always answer 200 and the admin UI can fall back to the manual buttons.
 */
export async function sendConfirmationEmail(booking: NotifyBooking): Promise<NotifySendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: false, reason: 'not_configured' }

  const to = (booking.email ?? '').trim()
  if (!to) return { sent: false, reason: 'no_email' }

  const { subject, html, text } = buildConfirmationEmail(booking)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || DEFAULT_FROM,
        to,
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`notify-booking: Resend responded ${res.status}`, detail.slice(0, 300))
      return { sent: false, reason: 'send_failed' }
    }
    return { sent: true, email: to }
  } catch (error) {
    console.error(
      'notify-booking: Resend call failed',
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    )
    return { sent: false, reason: 'send_failed' }
  } finally {
    clearTimeout(timer)
  }
}
