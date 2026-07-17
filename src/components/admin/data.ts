// -------------------------------------------------------------------------
// Admin data layer — live Supabase CRUD for the /admin dashboard.
//
// Kept separate from src/lib/api.ts (public catalogue reads) because Phase 3
// owns this file and must not edit shared lib code. Admins are authenticated,
// so RLS grants full SELECT (including inactive rows) and full write access;
// these reads therefore intentionally do NOT filter on is_active.
// Every function throws on error so callers surface a friendly error state.
// -------------------------------------------------------------------------
import { supabase } from '../../lib/supabase'
import { DEFAULT_SETTINGS } from '../../lib/settings'
import type {
  Booking,
  BookingStatus,
  BundleDiscount,
  BusinessHours,
  ContactMessage,
  Frequency,
  PropertyBand,
  Service,
  ServiceArea,
  ServicePrice,
  SiteSettings,
} from '../../lib/types'

// Types not present in the shared lib (admin-only shapes).
export interface BlockedSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  reason: string
  created_at: string
}
export interface AdminEmail {
  email: string
  added_at: string
}
export type MessageStatus = ContactMessage['status']

// ---------- date / time helpers ----------

/** Today as a local 'YYYY-MM-DD' string (no UTC day-shift). */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Add days to a 'YYYY-MM-DD' string, returning 'YYYY-MM-DD'. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Postgres `time` comes back as 'HH:MM:SS'; <input type="time"> wants 'HH:MM'. */
export function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : ''
}

/** kebab-case slug from a display name (for new services). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ---------- bookings ----------

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('service_date', { ascending: false })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as Booking[]
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) throw error
}

export async function updateBookingNotes(id: string, admin_notes: string): Promise<void> {
  const { error } = await supabase.from('bookings').update({ admin_notes }).eq('id', id)
  if (error) throw error
}

// ---------- dashboard ----------

export interface DashboardData {
  pending: number
  confirmedUpcoming: number
  newMessages: number
  upcoming: Booking[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const today = todayISO()
  const horizon = addDaysISO(today, 7)

  const [pendingRes, confirmedRes, messagesRes, upcomingRes] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('service_date', today),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase
      .from('bookings')
      .select('*')
      .gte('service_date', today)
      .lte('service_date', horizon)
      .in('status', ['pending', 'confirmed'])
      .order('service_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ])

  if (pendingRes.error) throw pendingRes.error
  if (confirmedRes.error) throw confirmedRes.error
  if (messagesRes.error) throw messagesRes.error
  if (upcomingRes.error) throw upcomingRes.error

  return {
    pending: pendingRes.count ?? 0,
    confirmedUpcoming: confirmedRes.count ?? 0,
    newMessages: messagesRes.count ?? 0,
    upcoming: (upcomingRes.data ?? []) as Booking[],
  }
}

// ---------- services & pricing ----------

export async function fetchServicesAdmin(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function fetchAllServicePrices(): Promise<ServicePrice[]> {
  const { data, error } = await supabase.from('service_prices').select('*')
  if (error) throw error
  return (data ?? []) as ServicePrice[]
}

export async function fetchPropertyBandsAdmin(): Promise<PropertyBand[]> {
  const { data, error } = await supabase
    .from('property_bands')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as PropertyBand[]
}

export async function fetchFrequenciesAdmin(): Promise<Frequency[]> {
  const { data, error } = await supabase
    .from('frequencies')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Frequency[]
}

export async function fetchBundleDiscountsAdmin(): Promise<BundleDiscount[]> {
  const { data, error } = await supabase
    .from('bundle_discounts')
    .select('*')
    .order('min_services', { ascending: true })
  if (error) throw error
  return (data ?? []) as BundleDiscount[]
}

export type ServiceDraft = Omit<Service, 'id'>

export async function createService(draft: ServiceDraft): Promise<Service> {
  const { data, error } = await supabase.from('services').insert(draft).select().single()
  if (error) throw error
  return data as Service
}

export async function updateService(id: string, patch: Partial<ServiceDraft>): Promise<void> {
  const { error } = await supabase.from('services').update(patch).eq('id', id)
  if (error) throw error
}

export interface ServicePriceRow {
  service_id: string
  band_code: string
  price: number
}

export async function upsertServicePrices(rows: ServicePriceRow[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase
    .from('service_prices')
    .upsert(rows, { onConflict: 'service_id,band_code' })
  if (error) throw error
}

export async function updateFrequency(code: string, patch: Partial<Omit<Frequency, 'code'>>): Promise<void> {
  const { error } = await supabase.from('frequencies').update(patch).eq('code', code)
  if (error) throw error
}

export async function createFrequency(freq: Frequency): Promise<void> {
  const { error } = await supabase.from('frequencies').insert(freq)
  if (error) throw error
}

export async function createBundleDiscount(input: Omit<BundleDiscount, 'id'>): Promise<void> {
  const { error } = await supabase.from('bundle_discounts').insert(input)
  if (error) throw error
}

export async function updateBundleDiscount(
  id: string,
  patch: Partial<Omit<BundleDiscount, 'id'>>,
): Promise<void> {
  const { error } = await supabase.from('bundle_discounts').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteBundleDiscount(id: string): Promise<void> {
  const { error } = await supabase.from('bundle_discounts').delete().eq('id', id)
  if (error) throw error
}

// ---------- areas ----------

export async function fetchAreasAdmin(): Promise<ServiceArea[]> {
  const { data, error } = await supabase
    .from('service_areas')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as ServiceArea[]
}

export type AreaDraft = Omit<ServiceArea, 'id'>

export async function createArea(draft: AreaDraft): Promise<void> {
  const { error } = await supabase.from('service_areas').insert(draft)
  if (error) throw error
}

export async function updateArea(id: string, patch: Partial<AreaDraft>): Promise<void> {
  const { error } = await supabase.from('service_areas').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteArea(id: string): Promise<void> {
  const { error } = await supabase.from('service_areas').delete().eq('id', id)
  if (error) throw error
}

// ---------- availability ----------

export async function fetchBusinessHoursAdmin(): Promise<BusinessHours[]> {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week', { ascending: true })
  if (error) throw error
  return (data ?? []) as BusinessHours[]
}

export async function upsertBusinessHours(rows: BusinessHours[]): Promise<void> {
  const { error } = await supabase.from('business_hours').upsert(rows, { onConflict: 'day_of_week' })
  if (error) throw error
}

export async function fetchBlockedSlots(): Promise<BlockedSlot[]> {
  const { data, error } = await supabase
    .from('blocked_slots')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as BlockedSlot[]
}

export type BlockedSlotDraft = Pick<BlockedSlot, 'date' | 'start_time' | 'end_time' | 'reason'>

export async function createBlockedSlot(draft: BlockedSlotDraft): Promise<void> {
  const { error } = await supabase.from('blocked_slots').insert(draft)
  if (error) throw error
}

export async function deleteBlockedSlot(id: string): Promise<void> {
  const { error } = await supabase.from('blocked_slots').delete().eq('id', id)
  if (error) throw error
}

// ---------- messages ----------

export async function fetchMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ContactMessage[]
}

export async function updateMessageStatus(id: string, status: MessageStatus): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
  if (error) throw error
}

// ---------- settings ----------

interface SettingsRow {
  key: string
  value: unknown
}

export interface SettingsResult {
  settings: SiteSettings
  /** Raw stored values by key, so we can preserve keys we don't render. */
  raw: Record<string, Record<string, unknown>>
}

/** Fetch every site_settings row and assemble the typed shape (+ raw values). */
export async function fetchSettings(): Promise<SettingsResult> {
  const { data, error } = await supabase.from('site_settings').select('key, value')
  if (error) throw error
  const rows = (data ?? []) as SettingsRow[]
  const raw: Record<string, Record<string, unknown>> = {}
  for (const row of rows) {
    if (row.value && typeof row.value === 'object') {
      raw[row.key] = row.value as Record<string, unknown>
    }
  }
  const settings: SiteSettings = {
    contact: { ...DEFAULT_SETTINGS.contact, ...(raw.contact ?? {}) },
    social: { ...DEFAULT_SETTINGS.social, ...(raw.social ?? {}) },
    booking: { ...DEFAULT_SETTINGS.booking, ...(raw.booking ?? {}) },
    business: { ...DEFAULT_SETTINGS.business, ...(raw.business ?? {}) },
  }
  return { settings, raw }
}

export async function upsertSetting(key: string, value: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}

// ---------- admin emails ----------

export async function fetchAdminEmails(): Promise<AdminEmail[]> {
  const { data, error } = await supabase
    .from('admin_emails')
    .select('email, added_at')
    .order('added_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as AdminEmail[]
}

export async function addAdminEmail(email: string): Promise<void> {
  const { error } = await supabase.from('admin_emails').insert({ email: email.trim().toLowerCase() })
  if (error) throw error
}

export async function removeAdminEmail(email: string): Promise<void> {
  const { error } = await supabase.from('admin_emails').delete().eq('email', email)
  if (error) throw error
}
