import { describe, expect, it } from 'vitest'
import { buildQuoteStarterUrl } from '../QuoteStarter'

// The starter card must hand off to /booking with exactly the param names and
// format BookingPage parses — the same shape Sparkle's chat handoff builds
// (ChatWidget.buildQuoteUrl) — so the wizard lands prefilled either way.
describe('buildQuoteStarterUrl', () => {
  it('builds a services-only URL when just a service is chosen', () => {
    expect(buildQuoteStarterUrl('window-cleaning', '', '')).toBe(
      '/booking?services=window-cleaning',
    )
  })

  it('adds the band when a property size is chosen', () => {
    expect(buildQuoteStarterUrl('window-cleaning', 'band_3', '')).toBe(
      '/booking?services=window-cleaning&band=band_3',
    )
  })

  it('adds the postcode when provided (space stays URL-encoded)', () => {
    expect(buildQuoteStarterUrl('window-cleaning', 'band_3', 'SS14 1AB')).toBe(
      '/booking?services=window-cleaning&band=band_3&postcode=SS14+1AB',
    )
  })

  it('keeps postcode without a band', () => {
    expect(buildQuoteStarterUrl('gutter-clearing', '', 'CM11 2AB')).toBe(
      '/booking?services=gutter-clearing&postcode=CM11+2AB',
    )
  })

  it('omits empty optional fields', () => {
    const url = buildQuoteStarterUrl('window-cleaning', '', '')
    expect(url).not.toContain('band=')
    expect(url).not.toContain('postcode=')
  })

  it('trims whitespace on every field', () => {
    expect(buildQuoteStarterUrl('  window-cleaning  ', '  band_3  ', '  SS14 1AB  ')).toBe(
      '/booking?services=window-cleaning&band=band_3&postcode=SS14+1AB',
    )
  })

  it('falls back to bare /booking when no service is chosen', () => {
    expect(buildQuoteStarterUrl('', 'band_3', 'SS14 1AB')).toBe('/booking')
    expect(buildQuoteStarterUrl('   ', '', '')).toBe('/booking')
  })

  it('preserves the param order: services, band, postcode', () => {
    expect(buildQuoteStarterUrl('fascia-soffit-cleaning', 'band_5p', 'CM11 2AB')).toBe(
      '/booking?services=fascia-soffit-cleaning&band=band_5p&postcode=CM11+2AB',
    )
  })
})
