// Customer notification helpers for the bookings drawer.
//
// Two tiers, so confirming a booking always has a way to tell the customer:
//   1. Manual (works with zero configuration): prefilled mailto:/sms: links
//      that open the admin's own mail or messages app with real booking data.
//   2. Automatic: POST /api/notify-booking with the signed-in admin's Supabase
//      access token. The function forwards that token to Supabase, so RLS
//      decides authorisation, and reports whether an email actually went out.
// Neither tier ever blocks or rolls back the status change itself.

import { supabase } from '../../lib/supabase'
import { formatDate, formatGBP, formatTime } from '../../lib/format'
import type { Booking } from '../../lib/types'

function firstName(booking: Booking): string {
  const first = booking.customer_name.trim().split(/\s+/)[0]
  return first || 'there'
}

function servicesList(booking: Booking): string {
  const names = (booking.items ?? []).map((item) => item.name).filter(Boolean)
  return names.length > 0 ? names.join(', ') : 'as agreed when you booked'
}

/** mailto: link with the confirmation subject and body prefilled from real booking data. */
export function buildConfirmationEmailLink(booking: Booking): string {
  const subject = `Your Gleaming Ant booking is confirmed (${booking.reference})`
  const body = [
    `Hi ${firstName(booking)},`,
    '',
    'Good news, your booking is confirmed.',
    '',
    `Reference: ${booking.reference}`,
    `Date: ${formatDate(booking.service_date)}`,
    `Time: ${formatTime(booking.start_time)}`,
    `Services: ${servicesList(booking)}`,
    `Total: ${formatGBP(booking.total)}`,
    '',
    'If anything needs changing, just reply to this email and we will sort it.',
    '',
    'See you soon,',
    'The Gleaming Ant team',
  ].join('\r\n')
  return `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** sms: link with a short confirmation message, or null when there is no phone number. */
export function buildConfirmationSmsLink(booking: Booking): string | null {
  const phone = booking.phone ? booking.phone.replace(/\s+/g, '') : ''
  if (!phone) return null
  const message = `Gleaming Ant: your booking ${booking.reference} is confirmed for ${formatDate(booking.service_date)} at ${formatTime(booking.start_time)}. Reply here if anything needs changing.`
  return `sms:${phone}?body=${encodeURIComponent(message)}`
}

export type NotifyOutcome =
  | { kind: 'sent'; email: string }
  | { kind: 'not_configured' }
  | { kind: 'failed' }

/**
 * Ask /api/notify-booking to email the customer. Never throws; every failure
 * mode (no session, network error, non-200, Resend failure) maps to a typed
 * outcome so the caller can toast the right message.
 */
export async function requestConfirmationEmail(bookingId: string): Promise<NotifyOutcome> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return { kind: 'failed' }

    const res = await fetch('/api/notify-booking', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    })
    const payload = (await res.json().catch(() => null)) as {
      sent?: boolean
      email?: string
      reason?: string
    } | null

    if (res.ok && payload?.sent) {
      return {
        kind: 'sent',
        email: typeof payload.email === 'string' && payload.email ? payload.email : 'the customer',
      }
    }
    if (res.ok && payload?.reason === 'not_configured') {
      return { kind: 'not_configured' }
    }
    return { kind: 'failed' }
  } catch {
    return { kind: 'failed' }
  }
}
