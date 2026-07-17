// POST /api/notify-booking  ->  send the customer their confirmation email.
//
// Request:  { booking_id: "<uuid>" }  with  Authorization: Bearer <supabase access token>
// Response: 200 { sent: true, email }                      email accepted by Resend
//           200 { sent: false, reason: 'not_configured' }  no RESEND_API_KEY yet
//           200 { sent: false, reason: 'send_failed' }     Resend errored / timed out
//           200 { sent: false, reason: 'no_email' }        booking has no email address
//           400 / 401 / 403 / 405 / 502 { error }          validation, auth, upstream
//
// SECURITY MODEL (deliberate, per docs/SPEC.md): this function holds NO
// service-role key. It fetches the booking from Supabase REST with the anon
// apikey plus the CALLER'S OWN bearer token, so row-level security answers the
// authorisation question: admins get the row back, anyone else gets an empty
// array and a 403. Configuration problems (no Resend key, Resend down) are
// reported inside a 200 so the admin UI can fall back to the manual buttons.

import { isUuid, sendConfirmationEmail, type NotifyBooking } from './lib/notify'

// Public-by-design fallbacks (publishable key; RLS is the security boundary),
// same pattern as lib/data.ts.
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://qrmbkqohrvylxswcqsal.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_9CR0ol6Gm3ROkox_bBm0Xg_d6w76Bym'

const FETCH_TIMEOUT_MS = 10_000

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Coerce a raw PostgREST row into the shape the email builder needs. */
function toNotifyBooking(row: Record<string, unknown>): NotifyBooking {
  const items = Array.isArray(row.items)
    ? row.items
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({ name: str(item.name), line_total: num(item.line_total) }))
        .filter((item) => item.name.length > 0)
    : []
  return {
    id: str(row.id),
    reference: str(row.reference),
    customer_name: str(row.customer_name),
    email: str(row.email),
    phone: str(row.phone),
    address_line1: str(row.address_line1),
    address_line2: str(row.address_line2),
    city: str(row.city),
    postcode: str(row.postcode),
    service_date: str(row.service_date),
    start_time: str(row.start_time),
    items,
    subtotal: num(row.subtotal),
    discount_amount: num(row.discount_amount),
    surcharge_amount: num(row.surcharge_amount),
    total: num(row.total),
  }
}

type BookingFetch = { ok: true; booking: NotifyBooking } | { ok: false; response: Response }

/**
 * Fetch the booking with the caller's own token forwarded, so RLS decides who
 * may notify: an empty result means "not an admin" (or no such booking) -> 403.
 */
async function fetchBooking(bookingId: string, authHeader: string): Promise<BookingFetch> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=*`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    if (res.status === 401) {
      return { ok: false, response: json({ error: 'Your session has expired. Sign in again.' }, 401) }
    }
    if (res.status === 403) {
      return { ok: false, response: json({ error: 'You do not have access to this booking.' }, 403) }
    }
    if (!res.ok) {
      console.error(`notify-booking: Supabase REST responded ${res.status}`)
      return { ok: false, response: json({ error: 'Could not load the booking.' }, 502) }
    }
    const rows = (await res.json()) as unknown
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        ok: false,
        response: json({ error: 'Booking not found, or you do not have access to it.' }, 403),
      }
    }
    return { ok: true, booking: toNotifyBooking(rows[0] as Record<string, unknown>) }
  } catch (error) {
    console.error(
      'notify-booking: booking fetch failed',
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    )
    return { ok: false, response: json({ error: 'Could not load the booking.' }, 502) }
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'content-type': 'application/json; charset=utf-8', Allow: 'POST' },
    })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  if (!/^Bearer\s+\S+$/i.test(authHeader)) {
    return json({ error: 'Sign in as an admin to send notifications.' }, 401)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const bookingId =
    body && typeof body === 'object' ? (body as Record<string, unknown>).booking_id : undefined
  if (!isUuid(bookingId)) {
    return json({ error: 'booking_id must be a UUID.' }, 400)
  }

  const result = await fetchBooking(bookingId, authHeader)
  if (!result.ok) return result.response

  const outcome = await sendConfirmationEmail(result.booking)
  return json(outcome, 200)
}
