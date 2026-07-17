// Booking submission — the one piece of the wizard that writes to Supabase.
// Verified against the live DB's RLS: anon users can INSERT bookings but CANNOT
// SELECT them, so we (a) generate the reference client-side, (b) insert WITHOUT
// .select() (minimal return — requesting a representation would fail RLS), and
// (c) retry once on a unique-violation with a fresh reference.

import { supabase } from '../../lib/supabase'
import type { BookingItem } from '../../lib/types'

// A–Z and 2–9 only (no 0/1/O/I — unambiguous when read aloud or over a message).
const REF_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'
const REF_LENGTH = 6

/** Generate a booking reference: 'GA-' + 6 crypto-random A–Z/2–9 characters. */
export function generateReference(): string {
  const bytes = new Uint8Array(REF_LENGTH)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < REF_LENGTH; i++) {
    out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length]
  }
  return `GA-${out}`
}

/** Columns the anon client is allowed to set. `status` is omitted (DB default 'pending'). */
export interface BookingInsert {
  customer_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  postcode: string
  area_name: string
  property_band: string
  frequency: string
  service_date: string // 'YYYY-MM-DD'
  start_time: string // 'HH:MM'
  duration_minutes: number
  items: BookingItem[]
  subtotal: number
  discount_amount: number
  surcharge_amount: number
  total: number
  customer_notes: string
}

const UNIQUE_VIOLATION = '23505'

/**
 * Insert a booking and return the generated reference. Retries once with a new
 * reference if the first collides (unique violation on `reference`). Throws on
 * any other error so the caller can show a friendly failure state.
 */
export async function insertBooking(payload: BookingInsert): Promise<string> {
  let reference = generateReference()
  const first = await supabase.from('bookings').insert({ ...payload, reference })

  if (first.error) {
    if (first.error.code === UNIQUE_VIOLATION) {
      reference = generateReference()
      const retry = await supabase.from('bookings').insert({ ...payload, reference })
      if (retry.error) throw retry.error
    } else {
      throw first.error
    }
  }

  return reference
}
