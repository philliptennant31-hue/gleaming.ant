import { supabase } from './supabase'
import type {
  BundleDiscount,
  BusinessHours,
  Faq,
  Frequency,
  PropertyBand,
  Service,
  ServiceArea,
  ServicePrice,
} from './types'

// -------------------------------------------------------------------------
// Public catalogue reads. Every function throws on error so callers (via
// useAsync) surface a friendly error state; empty tables resolve to [] / null.
// -------------------------------------------------------------------------

export async function fetchActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function fetchServiceBySlug(slug: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return (data as Service | null) ?? null
}

export async function fetchPropertyBands(): Promise<PropertyBand[]> {
  const { data, error } = await supabase
    .from('property_bands')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as PropertyBand[]
}

export async function fetchServicePrices(serviceId?: string): Promise<ServicePrice[]> {
  let query = supabase.from('service_prices').select('*')
  if (serviceId) query = query.eq('service_id', serviceId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ServicePrice[]
}

export async function fetchFrequencies(): Promise<Frequency[]> {
  const { data, error } = await supabase
    .from('frequencies')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Frequency[]
}

export async function fetchBundleDiscounts(): Promise<BundleDiscount[]> {
  const { data, error } = await supabase
    .from('bundle_discounts')
    .select('*')
    .eq('is_active', true)
    .order('min_services', { ascending: true })
  if (error) throw error
  return (data ?? []) as BundleDiscount[]
}

export async function fetchServiceAreas(): Promise<ServiceArea[]> {
  const { data, error } = await supabase
    .from('service_areas')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as ServiceArea[]
}

export async function fetchFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Faq[]
}

export async function fetchBusinessHours(): Promise<BusinessHours[]> {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week', { ascending: true })
  if (error) throw error
  return (data ?? []) as BusinessHours[]
}

// -------------------------------------------------------------------------
// Public writes
// -------------------------------------------------------------------------

export interface ContactInput {
  name: string
  email: string
  phone: string
  message: string
}

export async function submitContactMessage(input: ContactInput): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name,
    email: input.email,
    phone: input.phone,
    message: input.message,
    status: 'new',
  })
  if (error) throw error
}
