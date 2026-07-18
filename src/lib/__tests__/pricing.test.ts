import { describe, expect, it } from 'vitest'
import { computeQuote, matchArea, normalisePostcode, round2 } from '../pricing'
import type { BundleDiscount, Frequency, Service, ServiceArea, ServicePrice } from '../types'

// ---------------------------------------------------------------------------
// Fixtures — mirror the seed data in supabase/migrations (001_init.sql plus the
// 003_mirror_live_client_site.sql delta) so the tests double as a guard on the
// real catalogue's behaviour.
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
  id: 'gut', slug: 'gutter-cleaning', name: 'Gutter Cleaning',
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

// Mirrors the real Essex-wide coverage from 003_mirror_live_client_site.sql:
// every area £0 surcharge, with intentional overlapping outcodes (CM15 covers
// Brentwood/Shenfield/Mountnessing; CM4 covers Ingatestone/Stock) plus the
// Essex-wide catch-all sorted last.
const areas: ServiceArea[] = [
  area('Billericay', ['CM12', 'CM11'], 0, true, 1),
  area('Basildon', ['SS13', 'SS14', 'SS15', 'SS16'], 0, true, 2),
  area('Wickford', ['SS11', 'SS12'], 0, true, 3),
  area('Brentwood', ['CM14', 'CM13', 'CM15'], 0, true, 4),
  area('Shenfield', ['CM15'], 0, true, 5),
  area('Hutton', ['CM13'], 0, true, 6),
  area('Ingatestone', ['CM4'], 0, true, 7),
  area('Stock', ['CM4'], 0, true, 8),
  area('Ramsden Heath', ['CM11'], 0, true, 9),
  area('Mountnessing', ['CM15'], 0, true, 10),
  area('Chelmsford', ['CM1', 'CM2'], 0, true, 11),
  area('Danbury', ['CM3'], 0, true, 12),
  area('Great Baddow', ['CM2'], 0, true, 13),
  area('Rayleigh', ['SS6'], 0, true, 14),
  area('South Woodham Ferrers', ['CM3'], 0, true, 15),
  area('Essex & surrounding areas', ['SS', 'CM', 'CO', 'RM', 'IG'], 0, false, 99),
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
  it('matches a specific town outcode over the broad Essex catch-all', () => {
    expect(matchArea('SS15 1AA', areas)?.name).toBe('Basildon')
    expect(matchArea('ss15 1aa', areas)?.name).toBe('Basildon') // case/space-insensitive
    expect(matchArea('SS16 5ZZ', areas)?.name).toBe('Basildon')
    expect(matchArea('SS6 9ZZ', areas)?.name).toBe('Rayleigh')
  })

  it('resolves overlapping prefixes deterministically (lowest sort_order wins the tie)', () => {
    // CM15 sits in Brentwood, Shenfield AND Mountnessing — all length 4. The
    // first in sort order (Brentwood) wins; every area is £0 so the result is
    // equivalent for pricing whichever way the tie breaks. Must never throw.
    const cm15 = matchArea('CM15 9AA', areas)
    expect(cm15?.name).toBe('Brentwood')
    expect(cm15?.surcharge).toBe(0)
    // CM4 sits in Ingatestone AND Stock — deterministic, harmless.
    expect(matchArea('CM4 1AA', areas)?.name).toBe('Ingatestone')
  })

  it('falls back to the Essex-wide catch-all for other in-county postcodes', () => {
    const co1 = matchArea('CO1 1AA', areas)
    expect(co1?.name).toBe('Essex & surrounding areas')
    expect(co1?.is_core).toBe(false)
    expect(co1?.surcharge).toBe(0)
    expect(matchArea('RM12 6XY', areas)?.name).toBe('Essex & surrounding areas')
  })

  it('returns null for a postcode outside every area, and for empty input', () => {
    expect(matchArea('AB12 3CD', areas)).toBeNull()
    expect(matchArea('LS1 4PQ', areas)).toBeNull()
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
    expect(q.areaName).toBe('Basildon')
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
  it('covers an edge Essex postcode via the catch-all with no surcharge', () => {
    const q = computeQuote(
      { selectedServiceIds: ['gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS9 4AB' },
      data,
    )
    // SS9 is not a named town, so it lands on the zero-surcharge catch-all.
    expect(q.areaName).toBe('Essex & surrounding areas')
    expect(q.surcharge).toBe(0)
    expect(q.outsideArea).toBe(false)
    expect(q.total).toBe(80) // 80 subtotal, no surcharge
  })

  it('still applies a surcharge when an area defines one (engine capability)', () => {
    // Live data is all £0, but the engine must keep supporting a surcharge for
    // any area an admin adds via the dashboard.
    const surchargedAreas: ServiceArea[] = [area('Far Field', ['XX'], 9.5, false, 1)]
    const q = computeQuote(
      { selectedServiceIds: ['gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'XX1 2AB' },
      { ...data, areas: surchargedAreas },
    )
    expect(q.areaName).toBe('Far Field')
    expect(q.surcharge).toBe(9.5)
    expect(q.total).toBe(89.5) // 80 subtotal + 9.5 surcharge
  })

  it('charges no surcharge inside a core area', () => {
    const q = computeQuote(
      { selectedServiceIds: ['gut'], bandCode: 'band_3', frequencyCode: 'one_off', postcode: 'SS13 3AA' },
      data,
    )
    expect(q.areaName).toBe('Basildon')
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
