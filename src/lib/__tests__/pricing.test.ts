import { describe, expect, it } from 'vitest'
import { computeQuote, matchArea, normalisePostcode, round2 } from '../pricing'
import type { BundleDiscount, Frequency, Service, ServiceArea, ServicePrice } from '../types'

// ---------------------------------------------------------------------------
// Fixtures — mirror the seed data in supabase/migrations/001_init.sql so the
// tests double as a guard on the real catalogue's behaviour.
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

const window = svc({
  id: 'win', slug: 'window-cleaning', name: 'Window Cleaning',
  base_price: 15, duration_minutes: 45, supports_frequency: true, sort_order: 0,
})
const gutter = svc({
  id: 'gut', slug: 'gutter-clearing', name: 'Gutter Clearing',
  base_price: 70, duration_minutes: 90, supports_frequency: false, sort_order: 1,
})
const fascia = svc({
  id: 'fas', slug: 'fascia-soffit', name: 'Fascia & Soffit Cleaning',
  base_price: 80, duration_minutes: 120, supports_frequency: false, sort_order: 2,
})
const conservatory = svc({
  id: 'con', slug: 'conservatory-cleaning', name: 'Conservatory Cleaning',
  base_price: 50, duration_minutes: 90, supports_frequency: true, sort_order: 3,
})
// Solar intentionally has NO service_prices rows — exercises the base_price fallback.
const solar = svc({
  id: 'sol', slug: 'solar-panel-cleaning', name: 'Solar Panel Cleaning',
  base_price: 75, duration_minutes: 90, supports_frequency: false, sort_order: 4,
})

const services: Service[] = [window, gutter, fascia, conservatory, solar]

const PRICE_TABLE: Record<string, Record<string, number>> = {
  win: { band_1_2: 15, band_3: 20, band_4: 25, band_5p: 30 },
  gut: { band_1_2: 70, band_3: 80, band_4: 95, band_5p: 110 },
  fas: { band_1_2: 80, band_3: 100, band_4: 120, band_5p: 140 },
  con: { band_1_2: 50, band_3: 60, band_4: 70, band_5p: 80 },
}

const prices: ServicePrice[] = Object.entries(PRICE_TABLE).flatMap(([serviceId, byBand]) =>
  Object.entries(byBand).map(([band_code, price]) => ({
    id: `${serviceId}-${band_code}`,
    service_id: serviceId,
    band_code,
    price,
  })),
)

const frequencies: Frequency[] = [
  { code: 'every_4_weeks', label: 'Every 4 weeks (regular)', multiplier: 1.0, sort_order: 0, is_active: true },
  { code: 'every_8_weeks', label: 'Every 8 weeks (regular)', multiplier: 1.15, sort_order: 1, is_active: true },
  { code: 'one_off', label: 'One-off clean', multiplier: 1.35, sort_order: 2, is_active: true },
]

const bundles: BundleDiscount[] = [
  { id: 'b2', min_services: 2, discount_percent: 10, is_active: true },
  { id: 'b3', min_services: 3, discount_percent: 15, is_active: true },
]

function area(
  name: string,
  postcode_prefixes: string[],
  surcharge: number,
  is_core: boolean,
  sort_order: number,
): ServiceArea {
  return { id: name, name, postcode_prefixes, surcharge, is_core, is_active: true, sort_order }
}

const areas: ServiceArea[] = [
  area('Basildon & Laindon', ['SS13', 'SS14', 'SS15', 'SS16'], 0, true, 0),
  area('Benfleet', ['SS7'], 0, true, 1),
  area('Canvey Island', ['SS8'], 0, true, 2),
  area('South Woodham Ferrers', ['CM3'], 0, true, 3),
  area('Stanford-le-Hope', ['SS17'], 0, true, 4),
  area('Surrounding Essex', ['SS', 'CM'], 7.5, false, 5),
]

const data = { services, prices, frequencies, bundles, areas }

// ---------------------------------------------------------------------------

describe('round2', () => {
  it('rounds to 2dp and clamps non-finite input', () => {
    expect(round2(8.775)).toBe(8.78)
    expect(round2(1.005)).toBe(1.01)
    expect(round2(20 * 1.15)).toBe(23)
    expect(round2(Number.NaN)).toBe(0)
    expect(round2(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('normalisePostcode', () => {
  it('upper-cases and strips all whitespace', () => {
    expect(normalisePostcode('ss15 1aa')).toBe('SS151AA')
    expect(normalisePostcode('  cm3   4xy ')).toBe('CM34XY')
  })
})

describe('matchArea — longest-prefix postcode matching', () => {
  it('matches a core area on the more specific prefix, not the broad "SS"', () => {
    expect(matchArea('SS15 1AA', areas)?.name).toBe('Basildon & Laindon')
    expect(matchArea('ss15 1aa', areas)?.name).toBe('Basildon & Laindon') // case/space-insensitive
    expect(matchArea('SS16 5ZZ', areas)?.name).toBe('Basildon & Laindon')
  })

  it('routes SS17 to Stanford-le-Hope, never the broad SS surcharge area', () => {
    const match = matchArea('SS17 0AB', areas)
    expect(match?.name).toBe('Stanford-le-Hope')
    expect(match?.is_core).toBe(true)
    expect(match?.surcharge).toBe(0)
  })

  it('routes CM3 to South Woodham Ferrers, not the broad CM area', () => {
    expect(matchArea('CM3 5AA', areas)?.name).toBe('South Woodham Ferrers')
  })

  it('falls back to the broad prefix for other SS/CM postcodes (surcharge, non-core)', () => {
    const ss9 = matchArea('SS9 4AB', areas)
    expect(ss9?.name).toBe('Surrounding Essex')
    expect(ss9?.is_core).toBe(false)
    expect(ss9?.surcharge).toBe(7.5)
    expect(matchArea('CM99 9ZZ', areas)?.name).toBe('Surrounding Essex')
  })

  it('returns null for a postcode outside every area, and for empty input', () => {
    expect(matchArea('AB12 3CD', areas)).toBeNull()
    expect(matchArea('', areas)).toBeNull()
    expect(matchArea('   ', areas)).toBeNull()
  })
})

describe('computeQuote — single service', () => {
  it('looks up the band price and applies no discount', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win'], bandCode: 'band_3', frequencyCode: 'every_4_weeks', postcode: 'SS14 1AA' },
      data,
    )
    expect(q.lines).toHaveLength(1)
    expect(q.lines[0].unit_price).toBe(20) // band_3 window price
    expect(q.subtotal).toBe(20)
    expect(q.discountPercent).toBe(0)
    expect(q.discountAmount).toBe(0)
    expect(q.surcharge).toBe(0)
    expect(q.areaName).toBe('Basildon & Laindon')
    expect(q.outsideArea).toBe(false)
    expect(q.total).toBe(20)
    expect(q.durationMinutes).toBe(45)
  })

  it('falls back to base_price when no band row exists (solar has none)', () => {
    const q = computeQuote(
      { selectedServiceIds: ['sol'], bandCode: 'band_5p', frequencyCode: 'every_4_weeks', postcode: 'SS7 1AA' },
      data,
    )
    expect(q.lines[0].basePrice).toBe(75) // base_price fallback
    expect(q.lines[0].unit_price).toBe(75)
    expect(q.total).toBe(75)
  })
})

describe('computeQuote — frequency multiplier', () => {
  it('applies the multiplier only to services that support frequency', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win', 'gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS14 1AA' },
      data,
    )
    const win = q.lines.find((l) => l.service_id === 'win')!
    const gut = q.lines.find((l) => l.service_id === 'gut')!
    expect(win.frequencyApplied).toBe(true)
    expect(win.unit_price).toBe(27) // 20 × 1.35
    expect(gut.frequencyApplied).toBe(false)
    expect(gut.unit_price).toBe(80) // 80 × 1 — not multiplied
  })

  it('does not inflate a non-frequency service on a regular frequency', () => {
    const q = computeQuote(
      { selectedServiceIds: ['gut'], bandCode: 'band_3', frequencyCode: 'every_8_weeks', postcode: 'SS8 1AA' },
      data,
    )
    expect(q.lines[0].unit_price).toBe(80) // stays 80, not 80 × 1.15
  })

  it('rounds a frequency-multiplied line to 2dp', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win'], bandCode: 'band_3', frequencyCode: 'every_8_weeks', postcode: 'SS8 1AA' },
      data,
    )
    expect(q.lines[0].unit_price).toBe(23) // 20 × 1.15 = 22.999… → 23
  })
})

describe('computeQuote — bundle discounts', () => {
  it('applies no discount for a single service', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS14 1AA' },
      data,
    )
    expect(q.discountPercent).toBe(0)
  })

  it('applies 10% for two services', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win', 'gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS14 1AA' },
      data,
    )
    // 27 (window) + 80 (gutter) = 107
    expect(q.subtotal).toBe(107)
    expect(q.discountPercent).toBe(10)
    expect(q.discountAmount).toBe(10.7)
    expect(q.total).toBe(96.3)
    expect(q.durationMinutes).toBe(135)
  })

  it('applies the higher 15% band for three services', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win', 'gut', 'fas'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS14 1AA' },
      data,
    )
    // 27 + 80 + 100 = 207
    expect(q.subtotal).toBe(207)
    expect(q.discountPercent).toBe(15)
    expect(q.discountAmount).toBe(31.05)
    expect(q.total).toBe(175.95)
  })

  it('rounds the discount to 2dp at the discount step', () => {
    // conservatory 50 × 1.35 = 67.5 ; window 15 × 1.35 = 20.25 ; subtotal 87.75
    // 10% of 87.75 = 8.775 → 8.78 ; total 87.75 − 8.78 = 78.97
    const q = computeQuote(
      { selectedServiceIds: ['win', 'con'], bandCode: 'band_1_2', frequencyCode: 'one_off', postcode: 'SS14 1AA' },
      data,
    )
    expect(q.subtotal).toBe(87.75)
    expect(q.discountAmount).toBe(8.78)
    expect(q.total).toBe(78.97)
  })
})

describe('computeQuote — area surcharge & outside area', () => {
  it('adds the surcharge for a non-core (surrounding) postcode', () => {
    const q = computeQuote(
      { selectedServiceIds: ['gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS9 4AB' },
      data,
    )
    expect(q.areaName).toBe('Surrounding Essex')
    expect(q.surcharge).toBe(7.5)
    expect(q.outsideArea).toBe(false)
    expect(q.total).toBe(87.5) // 80 subtotal + 7.5 surcharge, no discount
  })

  it('charges no surcharge inside a core area', () => {
    const q = computeQuote(
      { selectedServiceIds: ['gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS13 3AA' },
      data,
    )
    expect(q.areaName).toBe('Basildon & Laindon')
    expect(q.surcharge).toBe(0)
    expect(q.total).toBe(80)
  })

  it('still returns a quote for an outside-area postcode, flagged', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win', 'gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'AB12 3CD' },
      data,
    )
    expect(q.outsideArea).toBe(true)
    expect(q.areaName).toBe('')
    expect(q.surcharge).toBe(0)
    expect(q.total).toBe(96.3) // subtotal − discount, no surcharge
  })
})

describe('computeQuote — edge cases', () => {
  it('handles an empty selection', () => {
    const q = computeQuote(
      { selectedServiceIds: [], bandCode: 'band_3', frequencyCode: 'one_off', postcode: '' },
      data,
    )
    expect(q.lines).toHaveLength(0)
    expect(q.subtotal).toBe(0)
    expect(q.discountPercent).toBe(0)
    expect(q.total).toBe(0)
    expect(q.durationMinutes).toBe(0)
    expect(q.outsideArea).toBe(true)
  })

  it('ignores unknown service ids', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win', 'does-not-exist'], bandCode: 'band_3', frequencyCode: 'every_4_weeks', postcode: 'SS14 1AA' },
      data,
    )
    expect(q.lines).toHaveLength(1)
    expect(q.subtotal).toBe(20)
  })

  it('emits lines in catalogue sort order regardless of selection order', () => {
    const q = computeQuote(
      { selectedServiceIds: ['fas', 'win', 'gut'], bandCode: 'band_3', frequencyCode: 'every_4_weeks', postcode: 'SS14 1AA' },
      data,
    )
    expect(q.lines.map((l) => l.service_id)).toEqual(['win', 'gut', 'fas'])
  })

  it('treats an unknown frequency as multiplier 1', () => {
    const q = computeQuote(
      { selectedServiceIds: ['win'], bandCode: 'band_3', frequencyCode: 'nonsense', postcode: 'SS14 1AA' },
      data,
    )
    expect(q.lines[0].unit_price).toBe(20)
  })
})
