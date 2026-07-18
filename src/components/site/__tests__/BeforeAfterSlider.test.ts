import { describe, expect, it } from 'vitest'
import { clampPercent, nextSliderValue, percentFromClientX } from '../BeforeAfterSlider'

describe('clampPercent', () => {
  it('keeps values inside 0–100', () => {
    expect(clampPercent(50)).toBe(50)
    expect(clampPercent(-20)).toBe(0)
    expect(clampPercent(140)).toBe(100)
  })

  it('treats NaN as 0', () => {
    expect(clampPercent(Number.NaN)).toBe(0)
  })
})

describe('percentFromClientX', () => {
  const rect = { left: 100, width: 200 }

  it('maps the pointer position across the element to 0–100', () => {
    expect(percentFromClientX(100, rect)).toBe(0) // left edge
    expect(percentFromClientX(200, rect)).toBe(50) // middle
    expect(percentFromClientX(300, rect)).toBe(100) // right edge
  })

  it('clamps pointers outside the element', () => {
    expect(percentFromClientX(0, rect)).toBe(0)
    expect(percentFromClientX(999, rect)).toBe(100)
  })

  it('is safe on a zero-width element', () => {
    expect(percentFromClientX(50, { left: 0, width: 0 })).toBe(0)
  })
})

describe('nextSliderValue', () => {
  it('nudges toward "before" on Left/Down', () => {
    expect(nextSliderValue(50, 'ArrowLeft')).toBe(46)
    expect(nextSliderValue(50, 'ArrowDown')).toBe(46)
  })

  it('nudges toward "after" on Right/Up', () => {
    expect(nextSliderValue(50, 'ArrowRight')).toBe(54)
    expect(nextSliderValue(50, 'ArrowUp')).toBe(54)
  })

  it('makes larger jumps on Page keys', () => {
    expect(nextSliderValue(50, 'PageUp')).toBe(66)
    expect(nextSliderValue(50, 'PageDown')).toBe(34)
  })

  it('jumps to the ends on Home/End', () => {
    expect(nextSliderValue(50, 'Home')).toBe(0)
    expect(nextSliderValue(50, 'End')).toBe(100)
  })

  it('clamps at the boundaries', () => {
    expect(nextSliderValue(2, 'ArrowLeft')).toBe(0)
    expect(nextSliderValue(98, 'ArrowRight')).toBe(100)
  })

  it('returns null for keys it does not handle', () => {
    expect(nextSliderValue(50, 'Enter')).toBeNull()
    expect(nextSliderValue(50, 'a')).toBeNull()
    expect(nextSliderValue(50, 'Tab')).toBeNull()
  })
})
