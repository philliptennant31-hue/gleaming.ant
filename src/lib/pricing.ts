// Quote engine — PURE functions only (no supabase, no React, no I/O).
// Implements the algorithm in docs/SPEC.md §"Quote engine". Fully unit-tested
// in src/lib/__tests__/pricing.test.ts.

import type { BundleDiscount, Frequency, Service, ServiceArea, ServicePrice } from './types'

/** Round to 2 decimal places, nudging past binary-float boundaries (e.g. x.xx5). */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Normalise a UK postcode for prefix comparison: upper-case, no whitespace. */
export function normalisePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, '')
}

/**
 * Match a postcode to a service area by LONGEST matching prefix.
 * "SS15…" → Basildon (SS15) beats the broad "SS" Essex-wide catch-all; "SS6…" →
 * Rayleigh, not the catch-all. Returns null when nothing matches (caller flags
 * the quote `outsideArea`). On an equal-length tie the first area wins — pass
 * areas pre-sorted by sort_order (core towns first, catch-all last). Some
 * outcodes intentionally sit in several towns; every area is £0 surcharge, so
 * the tie-break only affects the area name shown, never the price.
 */
export function matchArea(postcode: string, areas: ServiceArea[]): ServiceArea | null {
  const norm = normalisePostcode(postcode)
  if (!norm) return null

  let best: ServiceArea | null = null
  let bestLen = -1
  for (const area of areas) {
    for (const rawPrefix of area.postcode_prefixes) {
      const prefix = normalisePostcode(rawPrefix)
      if (!prefix) continue
      if (norm.startsWith(prefix) && prefix.length > bestLen) {
        best = area
        bestLen = prefix.length
      }
    }
  }
  return best
}

export interface QuoteInput {
  selectedServiceIds: string[]
  bandCode: string
  frequencyCode: string
  postcode: string
}

/** The catalogue slices the quote engine reads. A superset object is fine. */
export interface QuoteData {
  services: Service[]
  prices: ServicePrice[]
  frequencies: Frequency[]
  bundles: BundleDiscount[]
  areas: ServiceArea[]
}

export interface QuoteLine {
  service_id: string
  slug: string
  name: string
  /** Band price (or base_price fallback) BEFORE the frequency multiplier (2dp). */
  basePrice: number
  /** True when this service supports frequency and the multiplier was applied. */
  frequencyApplied: boolean
  /** Final per-visit price after the multiplier (2dp). */
  unit_price: number
  /** Line total — one unit per service, so equal to unit_price (2dp). */
  line_total: number
  durationMinutes: number
}

export interface QuoteBreakdown {
  lines: QuoteLine[]
  subtotal: number
  discountPercent: number
  discountAmount: number
  surcharge: number
  areaName: string
  outsideArea: boolean
  total: number
  durationMinutes: number
}

/**
 * Build a full quote breakdown from the user's selection and the catalogue.
 * Rounds to 2dp at every step (line price → subtotal → discount → total), per
 * SPEC. Frequency multiplier applies only to services with `supports_frequency`.
 * An unknown band falls back to each service's `base_price` (this also drives
 * the provisional "from" quote shown before a property band is chosen).
 */
export function computeQuote(input: QuoteInput, data: QuoteData): QuoteBreakdown {
  const { selectedServiceIds, bandCode, frequencyCode, postcode } = input

  const selectedSet = new Set(selectedServiceIds)
  // Iterate data.services so lines come out in catalogue sort order (stable).
  const selected = data.services.filter((s) => selectedSet.has(s.id))

  const frequency = data.frequencies.find((f) => f.code === frequencyCode)
  const multiplier = frequency ? frequency.multiplier : 1

  const lines: QuoteLine[] = selected.map((service) => {
    const priceRow = data.prices.find(
      (p) => p.service_id === service.id && p.band_code === bandCode,
    )
    const base = round2(priceRow ? priceRow.price : service.base_price)
    const frequencyApplied = service.supports_frequency
    const unit = round2(base * (frequencyApplied ? multiplier : 1))
    return {
      service_id: service.id,
      slug: service.slug,
      name: service.name,
      basePrice: base,
      frequencyApplied,
      unit_price: unit,
      line_total: unit,
      durationMinutes: service.duration_minutes,
    }
  })

  const subtotal = round2(lines.reduce((sum, line) => sum + line.line_total, 0))

  // Best bundle discount whose min_services is satisfied by the selection count.
  const count = lines.length
  const discountPercent = data.bundles
    .filter((b) => b.min_services <= count)
    .reduce((max, b) => Math.max(max, b.discount_percent), 0)
  const discountAmount = round2(subtotal * (discountPercent / 100))

  const area = matchArea(postcode, data.areas)
  const outsideArea = area === null
  const surcharge = area ? round2(area.surcharge) : 0
  const areaName = area ? area.name : ''

  const total = round2(subtotal - discountAmount + surcharge)
  const durationMinutes = lines.reduce((sum, line) => sum + line.durationMinutes, 0)

  return {
    lines,
    subtotal,
    discountPercent,
    discountAmount,
    surcharge,
    areaName,
    outsideArea,
    total,
    durationMinutes,
  }
}
