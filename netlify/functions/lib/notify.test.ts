import { describe, expect, it } from 'vitest'
import { buildConfirmationEmail, isUuid, type NotifyBooking } from './notify'

function fixture(overrides: Partial<NotifyBooking> = {}): NotifyBooking {
  return {
    id: '6f9619ff-8b86-4d01-b42d-00c04fc964ff',
    reference: 'GA-7Q2M4X',
    customer_name: 'Sam Carter',
    email: 'sam@example.com',
    phone: '07700 900123',
    address_line1: '12 High Street',
    address_line2: '',
    city: 'Chelmsford',
    postcode: 'CM1 1AB',
    service_date: '2026-07-24',
    start_time: '08:30:00',
    items: [
      { name: 'Window cleaning', line_total: 30 },
      { name: 'Gutter clearing', line_total: 60 },
    ],
    subtotal: 90,
    discount_amount: 9,
    surcharge_amount: 5.5,
    total: 86.5,
    ...overrides,
  }
}

describe('isUuid', () => {
  it('accepts a canonical UUID (either case)', () => {
    expect(isUuid('6f9619ff-8b86-4d01-b42d-00c04fc964ff')).toBe(true)
    expect(isUuid('6F9619FF-8B86-4D01-B42D-00C04FC964FF')).toBe(true)
  })

  it('rejects non-strings, malformed values and query-shaped strings', () => {
    expect(isUuid(undefined)).toBe(false)
    expect(isUuid(42)).toBe(false)
    expect(isUuid('')).toBe(false)
    expect(isUuid('GA-7Q2M4X')).toBe(false)
    expect(isUuid('6f9619ff-8b86-4d01-b42d')).toBe(false)
    expect(isUuid('6f9619ff-8b86-4d01-b42d-00c04fc964ff&select=email')).toBe(false)
  })
})

describe('buildConfirmationEmail', () => {
  it('uses the exact confirmation subject with the reference', () => {
    const { subject } = buildConfirmationEmail(fixture())
    expect(subject).toBe('Your Gleaming Ant booking is confirmed (GA-7Q2M4X)')
  })

  it('puts the real booking details in the plain-text part', () => {
    const { text } = buildConfirmationEmail(fixture())
    expect(text).toContain('Hi Sam,')
    expect(text).toContain('Reference: GA-7Q2M4X')
    expect(text).toContain('24 July 2026')
    expect(text).toContain('Fri')
    expect(text).toContain('8:30 am')
    expect(text).toContain('12 High Street, Chelmsford, CM1 1AB')
    expect(text).toContain('Window cleaning: £30')
    expect(text).toContain('Gutter clearing: £60')
    expect(text).toContain('Subtotal: £90')
    expect(text).toContain('Bundle discount: -£9')
    expect(text).toContain('Area surcharge: £5.50')
    expect(text).toContain('Total: £86.50')
    expect(text).toContain('reply to this email')
  })

  it('puts the details, brand header and reference accent in the HTML part', () => {
    const { html } = buildConfirmationEmail(fixture())
    expect(html).toContain('Gleaming Ant')
    expect(html).toContain('GA-7Q2M4X')
    expect(html).toContain('24 July 2026')
    expect(html).toContain('8:30 am')
    expect(html).toContain('Window cleaning')
    expect(html).toContain('£86.50')
    expect(html).toContain('#2e655e') // teal-deep header band
    expect(html).toContain('#e0913d') // amber reference accent
    expect(html).toContain('reply to this email')
  })

  it('omits the adjustment rows when there is no discount or surcharge', () => {
    const { text, html } = buildConfirmationEmail(
      fixture({ discount_amount: 0, surcharge_amount: 0, subtotal: 90, total: 90 }),
    )
    expect(text).not.toContain('Bundle discount')
    expect(text).not.toContain('Area surcharge')
    expect(text).not.toContain('Subtotal')
    expect(html).not.toContain('Bundle discount')
    expect(text).toContain('Total: £90')
  })

  it('escapes customer-supplied values in the HTML part', () => {
    const { html } = buildConfirmationEmail(
      fixture({ customer_name: '<script>alert(1)</script> Sam', address_line1: 'Flat 1 & 2 <b>' }),
    )
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Flat 1 &amp; 2 &lt;b&gt;')
  })

  it('copes with a missing name and empty items without placeholder markers', () => {
    const { text, html } = buildConfirmationEmail(fixture({ customer_name: '  ', items: [] }))
    expect(text).toContain('Hi there,')
    expect(text).toContain('As agreed when you booked')
    expect(text).not.toContain('[PLACEHOLDER')
    expect(html).not.toContain('[PLACEHOLDER')
  })

  it('contains no em dashes in any part', () => {
    const { subject, text, html } = buildConfirmationEmail(fixture())
    expect(subject).not.toContain('—')
    expect(text).not.toContain('—')
    expect(html).not.toContain('—')
  })
})
