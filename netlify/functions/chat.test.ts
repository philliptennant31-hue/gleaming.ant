import { describe, expect, it } from 'vitest'
import { isDegenerateReply } from './chat'

// Guards the degenerate-reply recovery path: when the structured-output model
// emits filler like "placeholder" instead of prose, coerceAiResponse throws and
// the handler falls back to the rules brain. This predicate is that gate.
describe('isDegenerateReply', () => {
  it('rejects the known degenerate tokens, case-insensitively', () => {
    const junk = [
      'placeholder',
      'Placeholder',
      'PLACEHOLDER',
      'todo',
      'TODO',
      'tbd',
      'TBD',
      'n/a',
      'N/A',
      'na',
      '...',
      '-',
      'xxx',
      'XXX',
    ]
    for (const value of junk) {
      expect(isDegenerateReply(value)).toBe(true)
    }
  })

  it('trims surrounding whitespace before judging', () => {
    expect(isDegenerateReply('  placeholder  ')).toBe(true)
    expect(isDegenerateReply('\n TBD \n')).toBe(true)
  })

  it('rejects anything too short to be a real sentence (under 8 chars)', () => {
    expect(isDegenerateReply('')).toBe(true)
    expect(isDegenerateReply('Yes!')).toBe(true)
    expect(isDegenerateReply('Sure')).toBe(true)
    expect(isDegenerateReply('Hi there')).toBe(false) // exactly 8 chars is fine
  })

  it('accepts a normal, full-length reply', () => {
    expect(
      isDegenerateReply('Yes, we cover Chelmsford and the surrounding Essex area.'),
    ).toBe(false)
    expect(isDegenerateReply('Window cleaning starts from £15 per visit.')).toBe(false)
    expect(isDegenerateReply('How many bedrooms does your property have?')).toBe(false)
  })
})
