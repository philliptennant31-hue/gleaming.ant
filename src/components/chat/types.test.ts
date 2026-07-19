import { describe, expect, it } from 'vitest'
import { draftReadiness } from './types'

// Drives the two-tier quote-handoff UI: 'ready' earns the loud amber CTA,
// 'partial' gets only the quiet skip-ahead link.
describe('draftReadiness', () => {
  it('is partial with a service but no property band', () => {
    expect(draftReadiness({ services: ['window-cleaning'] })).toBe('partial')
  })

  it('is ready once a service and a property band are both present', () => {
    expect(draftReadiness({ services: ['window-cleaning'], band_code: 'band_3' })).toBe('ready')
  })

  it('stays partial when a band is set but no service survives', () => {
    expect(draftReadiness({ services: [], band_code: 'band_3' })).toBe('partial')
    expect(draftReadiness({ services: ['   '], band_code: 'band_3' })).toBe('partial')
  })

  it('ignores frequency and postcode — only service + band decide readiness', () => {
    expect(
      draftReadiness({
        services: ['window-cleaning'],
        frequency_code: 'every_4_weeks',
        postcode: 'CM1',
      }),
    ).toBe('partial')
    expect(
      draftReadiness({
        services: ['window-cleaning', 'gutter-cleaning'],
        band_code: 'band_4',
        frequency_code: 'every_4_weeks',
        postcode: 'CM1',
      }),
    ).toBe('ready')
  })
})
