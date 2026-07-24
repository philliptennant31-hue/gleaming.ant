import { describe, expect, it } from 'vitest'
import {
  BOOKING_PAIRINGS,
  addChipLabel,
  bundleUpsellHeading,
  pairingPrice,
  pickPairings,
  resolveBundleUpsell,
} from '../pairings'
import type { BundleDiscount, Service, ServicePrice } from '../../../lib/types'

// ---------------------------------------------------------------------------
// A small slice of GA's live catalogue, mirroring the real slugs and running
// order so the mapped-pairing assertions double as a guard on BOOKING_PAIRINGS.
// ---------------------------------------------------------------------------

function svc(partial: Partial<Service> & Pick<Service, 'id' | 'slug' | 'name'>): Service {
  return {
    short_description: '',
    long_description: '',
    base_price: 0,
    unit_label: 'per visit',
    duration_minutes: 60,
    supports_frequency: false,
    price_note: '',
    icon: 'sparkles',
    is_active: true,
    sort_order: 0,
    ...partial,
  }
}

const windows = svc({ id: 'win', slug: 'window-cleaning', name: 'Window Cleaning', base_price: 20, sort_order: 0 })
const driveway = svc({ id: 'drv', slug: 'driveway-cleaning', name: 'Driveway Cleaning', base_price: 90, sort_order: 1 })
const gutter = svc({ id: 'gut', slug: 'gutter-cleaning', name: 'Gutter Cleaning', base_price: 80, sort_order: 3 })
const fascia = svc({ id: 'fas', slug: 'fascia-soffit', name: 'Fascia & Soffit Cleaning', base_price: 110, sort_order: 8 })

const services: Service[] = [windows, driveway, gutter, fascia]

const bundles: BundleDiscount[] = [
  { id: 'bundle-2', min_services: 2, discount_percent: 10, is_active: true },
  { id: 'bundle-3', min_services: 3, discount_percent: 15, is_active: true },
]

const prices: ServicePrice[] = [
  { id: 'p-gut-3', service_id: 'gut', band_code: 'band_3', price: 90 },
]

describe('BOOKING_PAIRINGS', () => {
  it('maps every entry to exactly two add-on slugs', () => {
    for (const [slug, addons] of Object.entries(BOOKING_PAIRINGS)) {
      expect(addons, slug).toHaveLength(2)
      expect(addons, slug).not.toContain(slug) // never pairs a service with itself
    }
  })

  it('never references the retired pressure-washing service', () => {
    expect(BOOKING_PAIRINGS['pressure-washing']).toBeUndefined()
    for (const addons of Object.values(BOOKING_PAIRINGS)) {
      expect(addons).not.toContain('pressure-washing')
    }
  })
})

describe('pickPairings', () => {
  it('returns the mapped pairings for a selected service, in order', () => {
    const picks = pickPairings(windows, services, ['win'])
    expect(picks.map((s) => s.slug)).toEqual(['gutter-cleaning', 'fascia-soffit'])
  })

  it('falls back to the first active services by sort_order when there is no map entry', () => {
    const mystery = svc({ id: 'mys', slug: 'mystery-service', name: 'Mystery', sort_order: 9 })
    const picks = pickPairings(mystery, [...services, mystery], ['mys'])
    expect(picks.map((s) => s.slug)).toEqual(['window-cleaning', 'driveway-cleaning'])
  })

  it('excludes services that are already selected, then tops up from the fallback', () => {
    const picks = pickPairings(windows, services, ['win', 'gut'])
    // Mapped [gutter, fascia]: gutter is already selected, so fascia stays and
    // the fallback adds the next active service by sort_order (driveway).
    expect(picks.map((s) => s.slug)).toEqual(['fascia-soffit', 'driveway-cleaning'])
  })

  it('excludes inactive services from both the map and the fallback', () => {
    const inactiveFascia = { ...fascia, is_active: false }
    const withInactive = [windows, driveway, gutter, inactiveFascia]
    const picks = pickPairings(windows, withInactive, ['win'])
    // Mapped [gutter, fascia]: fascia is inactive, so gutter stays and the
    // fallback tops up with driveway (fascia never appears).
    expect(picks.map((s) => s.slug)).toEqual(['gutter-cleaning', 'driveway-cleaning'])
    expect(picks.every((s) => s.is_active)).toBe(true)
  })

  it('never suggests the inactive pressure-washing service, even from the fallback', () => {
    const pressureWashing = svc({
      id: 'pw', slug: 'pressure-washing', name: 'Pressure Washing', base_price: 90, sort_order: 99, is_active: false,
    })
    const withRetired = [...services, pressureWashing]
    for (const selected of services) {
      const picks = pickPairings(selected, withRetired, [selected.id])
      expect(picks.map((s) => s.slug)).not.toContain('pressure-washing')
    }
  })

  it('never returns more than the limit', () => {
    expect(pickPairings(windows, services, ['win'], 1)).toHaveLength(1)
  })
})

describe('pairingPrice', () => {
  it('uses the band price when a band is chosen', () => {
    expect(pairingPrice(gutter, 'band_3', prices)).toBe(90)
  })

  it('falls back to the base from-price when no band is chosen', () => {
    expect(pairingPrice(gutter, '', prices)).toBe(80)
  })

  it('falls back to the base price when the band has no price row', () => {
    expect(pairingPrice(gutter, 'band_5p', prices)).toBe(80)
  })
})

describe('resolveBundleUpsell (strip visibility)', () => {
  it('shows the strip with one service selected and an active 2-service discount', () => {
    const model = resolveBundleUpsell({ services, prices, bundles, selectedIds: ['win'], bandCode: '' })
    expect(model).not.toBeNull()
    expect(model?.savePercent).toBe(10) // read from the live bundle row, not hardcoded
    expect(model?.chips).toHaveLength(2)
    expect(model?.chips.map((c) => c.service.slug)).toEqual(['gutter-cleaning', 'fascia-soffit'])
    expect(model?.chips[0].price).toBe(80) // base from-price, no band chosen
  })

  it('uses the chosen band price on the chips', () => {
    const model = resolveBundleUpsell({ services, prices, bundles, selectedIds: ['win'], bandCode: 'band_3' })
    expect(model?.chips[0].price).toBe(90)
  })

  it('hides the strip when two or more services are selected', () => {
    expect(
      resolveBundleUpsell({ services, prices, bundles, selectedIds: ['win', 'gut'], bandCode: '' }),
    ).toBeNull()
  })

  it('hides the strip when nothing is selected', () => {
    expect(resolveBundleUpsell({ services, prices, bundles, selectedIds: [], bandCode: '' })).toBeNull()
  })

  it('hides the strip when there is no active 2-service discount', () => {
    const onlyThree: BundleDiscount[] = [{ id: 'bundle-3', min_services: 3, discount_percent: 15, is_active: true }]
    expect(
      resolveBundleUpsell({ services, prices, bundles: onlyThree, selectedIds: ['win'], bandCode: '' }),
    ).toBeNull()
  })

  it('hides the strip when the 2-service discount is inactive', () => {
    const inactiveTwo: BundleDiscount[] = [
      { id: 'bundle-2', min_services: 2, discount_percent: 10, is_active: false },
    ]
    expect(
      resolveBundleUpsell({ services, prices, bundles: inactiveTwo, selectedIds: ['win'], bandCode: '' }),
    ).toBeNull()
  })

  it('hides the strip when the selected id is unknown', () => {
    expect(
      resolveBundleUpsell({ services, prices, bundles, selectedIds: ['ghost'], bandCode: '' }),
    ).toBeNull()
  })
})

describe('public-voice rule (no em dashes in the new strings)', () => {
  const EM_DASH = '—'

  it('keeps the heading free of em dashes across percents', () => {
    for (const percent of [10, 15, 20]) {
      const heading = bundleUpsellHeading(percent)
      expect(heading).not.toContain(EM_DASH)
    }
    expect(bundleUpsellHeading(10)).toBe('Add a second service and save 10%')
  })

  it('keeps every chip label free of em dashes', () => {
    for (const service of services) {
      const label = addChipLabel(service.name, '£80')
      expect(label).not.toContain(EM_DASH)
    }
    expect(addChipLabel('Gutter Cleaning', '£80')).toBe('Add Gutter Cleaning, £80')
  })
})
