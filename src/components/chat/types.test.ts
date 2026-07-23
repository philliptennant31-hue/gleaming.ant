import { describe, expect, it } from 'vitest'
import {
  CHAT_TEASER_KEY,
  draftReadiness,
  isChatTeaserDismissed,
  rememberChatTeaserDismissed,
} from './types'

/** A tiny in-memory stand-in for sessionStorage. */
function fakeStore(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, v),
  }
}

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

// The launcher teaser is a once-per-session nudge; these guard the persistence
// so it never re-appears after the visitor has waved it away.
describe('chat teaser dismissal', () => {
  it('reads as not dismissed on a fresh session', () => {
    expect(isChatTeaserDismissed(fakeStore())).toBe(false)
  })

  it('reads as dismissed once remembered', () => {
    const store = fakeStore()
    rememberChatTeaserDismissed(store)
    expect(store.getItem(CHAT_TEASER_KEY)).toBe('1')
    expect(isChatTeaserDismissed(store)).toBe(true)
  })

  it('treats a missing store as not dismissed and never throws', () => {
    expect(isChatTeaserDismissed(null)).toBe(false)
    expect(() => rememberChatTeaserDismissed(null)).not.toThrow()
  })

  it('survives a storage that throws (private mode)', () => {
    const throwing = {
      getItem() {
        throw new Error('denied')
      },
      setItem() {
        throw new Error('denied')
      },
    }
    expect(isChatTeaserDismissed(throwing)).toBe(false)
    expect(() => rememberChatTeaserDismissed(throwing)).not.toThrow()
  })
})
