// Booking pairings — CODE-LEVEL trade knowledge for the running-quote bundle
// nudge. When a high-intent visitor arrives via a prefill link with exactly one
// service (a service Quote button, the hero QuoteStarter, or the chat handoff),
// the QuotePanel offers up to two natural "and while you're here" add-ons so
// they still see the bundle discount they'd otherwise skip.
//
// This map is deliberately NOT part of the catalogue, the database or the seed
// generator: it is a presentation-layer opinion about which services pair well,
// kept next to the component that uses it. GA's catalogue is live from the DB,
// so these slugs mirror the active services.
//
// All the picking logic below is PURE and unit-tested in
// src/components/booking/__tests__/pairings.test.ts.

import type { BundleDiscount, Service, ServicePrice } from '../../lib/types'

/**
 * Recommended add-on service slugs, keyed by the slug of the one service the
 * visitor has already picked. Two per entry, best first. A slug that isn't in
 * the live catalogue (or is inactive, or already selected) is skipped by
 * pickPairings and the sort_order fallback fills the gap, so the map is always
 * safe. Trade: exterior property cleaning. (The retired `pressure-washing`
 * service is inactive in the live catalogue and never suggested.)
 */
export const BOOKING_PAIRINGS: Record<string, string[]> = {
  'window-cleaning': ['gutter-cleaning', 'fascia-soffit'],
  'gutter-cleaning': ['fascia-soffit', 'window-cleaning'],
  'fascia-soffit': ['gutter-cleaning', 'window-cleaning'],
  'conservatory-cleaning': ['window-cleaning', 'gutter-cleaning'],
  'solar-panel-cleaning': ['roof-cleaning', 'window-cleaning'],
  'driveway-cleaning': ['patio-cleaning', 'render-cleaning'],
  'patio-cleaning': ['driveway-cleaning', 'render-cleaning'],
  'roof-cleaning': ['gutter-cleaning', 'render-cleaning'],
  'render-cleaning': ['brickwork-cleaning', 'roof-cleaning'],
  'brickwork-cleaning': ['render-cleaning', 'driveway-cleaning'],
}

/**
 * The price to show on an add chip: the current band's price when a band is
 * chosen, otherwise the service's base "from" price. Mirrors the quote engine's
 * band-to-base fallback so the chip and the quote agree.
 */
export function pairingPrice(service: Service, bandCode: string, prices: ServicePrice[]): number {
  const row = bandCode
    ? prices.find((p) => p.service_id === service.id && p.band_code === bandCode)
    : undefined
  return row ? row.price : service.base_price
}

/**
 * Choose up to `limit` add-on services to suggest alongside `selected`.
 * First the mapped pairings for its slug, in order; then a fallback of the
 * remaining active services by sort_order. Only active services that are not
 * already selected are ever returned. Pure and deterministic.
 */
export function pickPairings(
  selected: Service,
  services: Service[],
  selectedIds: string[],
  limit = 2,
): Service[] {
  const chosen = new Set(selectedIds)
  const bySlug = new Map(services.map((s) => [s.slug, s]))
  const picks: Service[] = []
  const taken = new Set<string>()

  const consider = (candidate: Service | undefined) => {
    if (
      candidate &&
      candidate.is_active &&
      !chosen.has(candidate.id) &&
      !taken.has(candidate.id) &&
      picks.length < limit
    ) {
      taken.add(candidate.id)
      picks.push(candidate)
    }
  }

  for (const slug of BOOKING_PAIRINGS[selected.slug] ?? []) consider(bySlug.get(slug))

  if (picks.length < limit) {
    const bySort = [...services].sort((a, b) => a.sort_order - b.sort_order)
    for (const candidate of bySort) {
      consider(candidate)
      if (picks.length >= limit) break
    }
  }

  return picks
}

export interface BundleUpsellChip {
  service: Service
  price: number
}

export interface BundleUpsellModel {
  savePercent: number
  chips: BundleUpsellChip[]
}

/**
 * View-model for the QuotePanel's bundle nudge, or null when the strip should
 * not render. It renders only when EXACTLY ONE service is selected and an active
 * 2-service bundle discount exists; the percent is read from that live row and
 * never hardcoded. Pure and unit-tested.
 */
export function resolveBundleUpsell(args: {
  services: Service[]
  prices: ServicePrice[]
  bundles: BundleDiscount[]
  selectedIds: string[]
  bandCode: string
}): BundleUpsellModel | null {
  const { services, prices, bundles, selectedIds, bandCode } = args
  if (selectedIds.length !== 1) return null

  const twoService = bundles.find((b) => b.is_active && b.min_services === 2)
  if (!twoService || twoService.discount_percent <= 0) return null

  const selected = services.find((s) => s.id === selectedIds[0])
  if (!selected) return null

  const picks = pickPairings(selected, services, selectedIds, 2)
  if (picks.length === 0) return null

  return {
    savePercent: twoService.discount_percent,
    chips: picks.map((service) => ({ service, price: pairingPrice(service, bandCode, prices) })),
  }
}

/** The nudge heading. Kept pure so the public-voice rule is unit-testable. */
export function bundleUpsellHeading(savePercent: number): string {
  return `Add a second service and save ${savePercent}%`
}

/** A chip's accessible label, e.g. "Add Gutter Cleaning, £80". */
export function addChipLabel(serviceName: string, priceLabel: string): string {
  return `Add ${serviceName}, ${priceLabel}`
}
