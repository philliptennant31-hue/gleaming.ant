// Loads the Gleaming Ant catalogue from Supabase via the REST (PostgREST) API.
//
// No supabase-js in functions — plain `fetch` with the `apikey` header. All
// fetches run in parallel behind a single 5s timeout and degrade gracefully to
// empty arrays / default settings on any failure, so the assistant always has
// *something* to answer with (the rules brain copes with empty data).
//
// The URL + anon key fall back to the project's PUBLIC-by-design values
// (publishable key — safe to hardcode; RLS is the security boundary).

import type {
  BundleDiscount,
  BusinessData,
  Faq,
  Frequency,
  PropertyBand,
  Service,
  ServiceArea,
  ServicePrice,
  SiteSettings,
} from './types'

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? 'https://qrmbkqohrvylxswcqsal.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_9CR0ol6Gm3ROkox_bBm0Xg_d6w76Bym'

const TIMEOUT_MS = 5000

interface SettingRow {
  key: string
  value: unknown
}

async function restGet<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
    signal,
  })
  if (!res.ok) {
    throw new Error(`Supabase REST ${path} -> ${res.status}`)
  }
  const data = (await res.json()) as unknown
  return Array.isArray(data) ? (data as T[]) : []
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function defaultSettings(): SiteSettings {
  return {
    contact: { phone: '', email: '', whatsapp: '' },
    business: {
      name: 'Gleaming Ant',
      tagline: 'Window & Exterior Cleaning',
      area: 'Essex',
      domain: '',
    },
  }
}

function parseSettings(rows: SettingRow[]): SiteSettings {
  const settings = defaultSettings()
  for (const row of rows) {
    if (!row || typeof row !== 'object' || !row.value || typeof row.value !== 'object') {
      continue
    }
    const value = row.value as Record<string, unknown>
    if (row.key === 'contact') {
      settings.contact = {
        phone: str(value.phone),
        email: str(value.email),
        whatsapp: str(value.whatsapp),
      }
    } else if (row.key === 'business') {
      settings.business = {
        name: str(value.name) || settings.business.name,
        tagline: str(value.tagline) || settings.business.tagline,
        area: str(value.area) || settings.business.area,
        domain: str(value.domain),
      }
    }
  }
  return settings
}

function emptyData(): BusinessData {
  return {
    services: [],
    servicePrices: [],
    propertyBands: [],
    frequencies: [],
    bundleDiscounts: [],
    serviceAreas: [],
    faqs: [],
    settings: defaultSettings(),
  }
}

/**
 * Fetch the full catalogue the assistant needs. Never throws: any per-table
 * failure (network, timeout, non-2xx) resolves to an empty list for that table.
 */
export async function loadBusinessData(): Promise<BusinessData> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const { signal } = controller

  // Each fetch is wrapped so one failure can't reject the whole batch.
  const safe = async <T>(promise: Promise<T[]>): Promise<T[]> => {
    try {
      return await promise
    } catch {
      return []
    }
  }

  try {
    const [
      services,
      servicePrices,
      propertyBands,
      frequencies,
      bundleDiscounts,
      serviceAreas,
      faqs,
      settingsRows,
    ] = await Promise.all([
      safe<Service>(
        restGet('services?is_active=eq.true&order=sort_order.asc&select=*', signal),
      ),
      safe<ServicePrice>(restGet('service_prices?select=*', signal)),
      safe<PropertyBand>(restGet('property_bands?order=sort_order.asc&select=*', signal)),
      safe<Frequency>(
        restGet('frequencies?is_active=eq.true&order=sort_order.asc&select=*', signal),
      ),
      safe<BundleDiscount>(
        restGet(
          'bundle_discounts?is_active=eq.true&order=min_services.asc&select=*',
          signal,
        ),
      ),
      safe<ServiceArea>(
        restGet('service_areas?is_active=eq.true&order=sort_order.asc&select=*', signal),
      ),
      safe<Faq>(
        restGet('faqs?is_active=eq.true&order=category.asc,sort_order.asc&select=*', signal),
      ),
      safe<SettingRow>(restGet('site_settings?select=key,value', signal)),
    ])

    return {
      services,
      servicePrices,
      propertyBands,
      frequencies,
      bundleDiscounts,
      serviceAreas,
      faqs,
      settings: parseSettings(settingsRows),
    }
  } catch {
    // Belt-and-suspenders: Promise.all of `safe()` shouldn't reject, but if the
    // environment lacks fetch/AbortController we still return usable defaults.
    return emptyData()
  } finally {
    clearTimeout(timer)
  }
}
