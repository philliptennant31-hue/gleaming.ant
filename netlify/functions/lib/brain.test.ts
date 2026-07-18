import { describe, expect, it } from 'vitest'
import { answerWithRules, extractQuoteDraft, isRoutePath, validateQuoteDraft } from './brain'
import type { BusinessData, ChatMessage, ChatResponse } from './types'

// ---------------------------------------------------------------------------
// Fixture catalogue — a representative slice of the live Supabase data.
// ---------------------------------------------------------------------------

const data: BusinessData = {
  services: [
    {
      id: 'svc-window',
      slug: 'window-cleaning',
      name: 'Window Cleaning',
      short_description: 'Crystal-clear windows, frames and sills, every time.',
      long_description: '',
      base_price: 15,
      unit_label: 'per visit',
      duration_minutes: 45,
      supports_frequency: true,
      price_note: 'Prices are placeholders pending confirmation',
      icon: 'window',
      is_active: true,
      sort_order: 0,
    },
    {
      id: 'svc-gutter',
      slug: 'gutter-cleaning',
      name: 'Gutter Cleaning',
      short_description: 'Blocked gutters emptied, checked and flowing again.',
      long_description: '',
      base_price: 70,
      unit_label: 'per visit',
      duration_minutes: 90,
      supports_frequency: false,
      price_note: '',
      icon: 'gutter',
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'svc-solar',
      slug: 'solar-panel-cleaning',
      name: 'Solar Panel Cleaning',
      short_description: 'Clean panels generate more and protect your investment.',
      long_description: '',
      base_price: 75,
      unit_label: 'per visit',
      duration_minutes: 90,
      supports_frequency: false,
      price_note: '',
      icon: 'solar',
      is_active: true,
      sort_order: 2,
    },
  ],
  servicePrices: [
    { id: 'p1', service_id: 'svc-window', band_code: 'band_1_2', price: 15 },
    { id: 'p2', service_id: 'svc-window', band_code: 'band_3', price: 20 },
    { id: 'p3', service_id: 'svc-window', band_code: 'band_4', price: 25 },
    { id: 'p4', service_id: 'svc-window', band_code: 'band_5p', price: 30 },
    { id: 'p5', service_id: 'svc-gutter', band_code: 'band_1_2', price: 70 },
    { id: 'p6', service_id: 'svc-solar', band_code: 'band_1_2', price: 75 },
  ],
  propertyBands: [
    { code: 'band_1_2', label: '1–2 bedrooms', sort_order: 0 },
    { code: 'band_3', label: '3 bedrooms', sort_order: 1 },
    { code: 'band_4', label: '4 bedrooms', sort_order: 2 },
    { code: 'band_5p', label: '5+ bedrooms', sort_order: 3 },
  ],
  frequencies: [
    { code: 'every_4_weeks', label: 'Every 4 weeks (regular)', multiplier: 1, sort_order: 0, is_active: true },
    { code: 'every_8_weeks', label: 'Every 8 weeks (regular)', multiplier: 1.15, sort_order: 1, is_active: true },
    { code: 'one_off', label: 'One-off clean', multiplier: 1.35, sort_order: 2, is_active: true },
  ],
  bundleDiscounts: [
    { id: 'b1', min_services: 2, discount_percent: 10, is_active: true },
    { id: 'b2', min_services: 3, discount_percent: 15, is_active: true },
  ],
  // Mirrors the real Essex-wide coverage (003 migration): every area £0
  // surcharge, with intentional overlapping outcodes (CM15 in Brentwood
  // AND Shenfield) to exercise deterministic longest-prefix resolution.
  serviceAreas: [
    {
      id: 'a1',
      name: 'Basildon',
      postcode_prefixes: ['SS13', 'SS14', 'SS15', 'SS16'],
      surcharge: 0,
      is_core: true,
      is_active: true,
      sort_order: 2,
    },
    {
      id: 'a2',
      name: 'Brentwood',
      postcode_prefixes: ['CM14', 'CM13', 'CM15'],
      surcharge: 0,
      is_core: true,
      is_active: true,
      sort_order: 4,
    },
    {
      id: 'a3',
      name: 'Shenfield',
      postcode_prefixes: ['CM15'],
      surcharge: 0,
      is_core: true,
      is_active: true,
      sort_order: 5,
    },
    {
      id: 'a4',
      name: 'Rayleigh',
      postcode_prefixes: ['SS6'],
      surcharge: 0,
      is_core: true,
      is_active: true,
      sort_order: 14,
    },
    {
      id: 'a5',
      name: 'Essex & surrounding areas',
      postcode_prefixes: ['SS', 'CM', 'CO', 'RM', 'IG'],
      surcharge: 0,
      is_core: false,
      is_active: true,
      sort_order: 99,
    },
  ],
  faqs: [
    {
      id: 'f1',
      question: 'Are you insured?',
      answer: 'Yes, Gleaming Ant is fully insured, so your home is protected while we work.',
      category: 'general',
      sort_order: 0,
      is_active: true,
    },
    {
      id: 'f2',
      question: 'How do I pay?',
      answer: '[PLACEHOLDER: confirm payment methods]',
      category: 'pricing',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'f3',
      question: 'Do I need to be home when you clean?',
      answer:
        "Not usually. As long as we can access the areas that need cleaning you don't need to be in.",
      category: 'general',
      sort_order: 2,
      is_active: true,
    },
  ],
  settings: {
    contact: { phone: '[PLACEHOLDER]', email: '[PLACEHOLDER]', whatsapp: '[PLACEHOLDER]' },
    business: { name: 'Gleaming Ant', tagline: 'Window & Exterior Cleaning', area: 'Essex', domain: '' },
  },
}

const ask = (content: string): ChatResponse =>
  answerWithRules([{ role: 'user', content }], data)

/** Every response must satisfy the binding SPEC contract. */
function assertShape(res: ChatResponse): void {
  expect(typeof res.reply).toBe('string')
  expect(res.reply.trim().length).toBeGreaterThan(0)
  expect(Array.isArray(res.links)).toBe(true)
  expect(res.links.length).toBeLessThanOrEqual(2)
  for (const link of res.links) {
    expect(typeof link.label).toBe('string')
    expect(link.label.length).toBeGreaterThan(0)
    expect(isRoutePath(link.path)).toBe(true)
  }
  expect(Array.isArray(res.suggested_replies)).toBe(true)
  expect(res.suggested_replies.length).toBeLessThanOrEqual(3)
  for (const suggestion of res.suggested_replies) {
    expect(typeof suggestion).toBe('string')
  }
  expect(res.source).toBe('rules')
}

describe('answerWithRules — intents', () => {
  it('greets', () => {
    const res = ask('hi')
    expect(res.reply).toContain('Sparkle')
    assertShape(res)
  })

  it('greets when there is no user message', () => {
    const res = answerWithRules([], data)
    expect(res.reply).toContain('Sparkle')
    assertShape(res)
  })

  it('does not treat a substantive question as a greeting', () => {
    const res = ask('hi, how much is window cleaning?')
    expect(res.reply).toContain('£15')
    assertShape(res)
  })

  it('answers a service price with the from-price', () => {
    const res = ask('how much is window cleaning?')
    expect(res.reply).toContain('Window Cleaning')
    expect(res.reply).toContain('£15')
    expect(res.links.some((l) => l.path === '/pricing')).toBe(true)
    assertShape(res)
  })

  it('points to the pricing page for a generic price question', () => {
    const res = ask('what are your prices like?')
    expect(res.reply.toLowerCase()).toContain('pricing page')
    expect(res.links.some((l) => l.path === '/pricing')).toBe(true)
    assertShape(res)
  })

  it('describes a service by synonym (gutters)', () => {
    const res = ask('tell me about your guttering work')
    expect(res.reply).toContain('Gutter Cleaning')
    expect(res.links.some((l) => l.path === '/services/gutter-cleaning')).toBe(true)
    assertShape(res)
  })

  it('matches a new service by keyword (driveway / jet wash)', () => {
    const withDriveway: BusinessData = {
      ...data,
      services: [
        ...data.services,
        {
          id: 'svc-driveway',
          slug: 'driveway-cleaning',
          name: 'Driveway Cleaning',
          short_description: 'Restoring driveways to a cleaner, smarter finish.',
          long_description: '',
          base_price: 90,
          unit_label: 'per visit',
          duration_minutes: 150,
          supports_frequency: false,
          price_note: '',
          icon: 'pressure',
          is_active: true,
          sort_order: 1,
        },
      ],
    }
    const res = answerWithRules([{ role: 'user', content: 'can you jet wash my drive?' }], withDriveway)
    expect(res.reply).toContain('Driveway Cleaning')
    expect(res.links.some((l) => l.path === '/services/driveway-cleaning')).toBe(true)
    assertShape(res)
  })

  it('describes a service by synonym (solar)', () => {
    const res = ask('do you clean solar panels?')
    expect(res.reply).toContain('Solar Panel Cleaning')
    assertShape(res)
  })

  it('lists services for a generic services question', () => {
    const res = ask('what services do you offer?')
    expect(res.reply).toContain('Window Cleaning')
    expect(res.reply).toContain('Gutter Cleaning')
    expect(res.links.some((l) => l.path === '/services')).toBe(true)
    assertShape(res)
  })

  it('routes booking intents to /booking', () => {
    const res = ask("I'd like to book a clean")
    expect(res.links.some((l) => l.path === '/booking')).toBe(true)
    assertShape(res)
  })

  it('confirms a core postcode inside the area', () => {
    const res = ask('do you cover SS14?')
    expect(res.reply).toContain('Basildon')
    expect(res.links.some((l) => l.path === '/booking')).toBe(true)
    assertShape(res)
  })

  it('covers an edge Essex postcode via the catch-all, no surcharge', () => {
    const res = ask('do you cover SS9?')
    // SS9 is not a named town, so it falls to the zero-surcharge catch-all.
    expect(res.reply.toLowerCase()).toContain('cover')
    expect(res.reply.toLowerCase()).not.toContain('surcharge')
    assertShape(res)
  })

  it('resolves an overlapping-prefix postcode deterministically', () => {
    // CM15 sits in Brentwood AND Shenfield; the lower sort_order (Brentwood)
    // wins the longest-prefix tie, deterministically and without error.
    const res = ask('do you cover CM15?')
    expect(res.reply).toContain('Brentwood')
    expect(res.reply.toLowerCase()).not.toContain('surcharge')
    assertShape(res)
  })

  it('still mentions a surcharge when an area actually has one (dormant capability)', () => {
    // Live data is all £0, but the branch must stay correct if an admin
    // ever adds a surcharged area via the dashboard.
    const surchargedData: BusinessData = {
      ...data,
      serviceAreas: [
        {
          id: 'far',
          name: 'Far Field',
          postcode_prefixes: ['XX'],
          surcharge: 12.5,
          is_core: false,
          is_active: true,
          sort_order: 1,
        },
      ],
    }
    const res = answerWithRules([{ role: 'user', content: 'do you cover XX1?' }], surchargedData)
    expect(res.reply.toLowerCase()).toContain('surcharge')
    assertShape(res)
  })

  it('is honest about a postcode outside the area', () => {
    const res = ask('do you cover LS1?')
    expect(res.reply).toContain('LS1')
    expect(res.links.some((l) => l.path === '/contact')).toBe(true)
    assertShape(res)
  })

  it('lists areas for a plain coverage question', () => {
    const res = ask('which areas do you cover?')
    expect(res.reply).toContain('Basildon')
    expect(res.links.some((l) => l.path === '/areas')).toBe(true)
    assertShape(res)
  })

  it('explains cleaning frequency', () => {
    const res = ask('how often should I get my windows done?')
    expect(res.reply).toContain('every 4')
    assertShape(res)
  })

  it('answers the insurance question from the FAQ', () => {
    const res = ask('are you fully insured?')
    expect(res.reply.toLowerCase()).toContain('insured')
    assertShape(res)
  })

  it('never surfaces a placeholder payment answer', () => {
    const res = ask('how do I pay you?')
    expect(res.reply).not.toContain('[PLACEHOLDER')
    expect(res.reply.toLowerCase()).toContain('payment')
    assertShape(res)
  })

  it('routes "speak to a human" to contact', () => {
    const res = ask('can I speak to someone?')
    expect(res.links.some((l) => l.path === '/contact')).toBe(true)
    assertShape(res)
  })

  it('fuzzy-matches a FAQ question', () => {
    const res = ask('do I need to be home?')
    expect(res.reply.toLowerCase()).toContain('access')
    assertShape(res)
  })

  it('falls back gracefully for an unknown question', () => {
    const res = ask('what is the meaning of life?')
    expect(res.reply.toLowerCase()).toContain('message the team')
    expect(res.links.some((l) => l.path === '/contact')).toBe(true)
    assertShape(res)
  })
})

describe('answerWithRules — contract', () => {
  const probes = [
    '',
    'hi',
    'hello there',
    'how much is window cleaning',
    'do you clean gutters',
    'solar panels please',
    'book me in',
    'do you cover SS14',
    'do you cover SS9',
    'do you cover LS1',
    'how often should I clean',
    'are you insured',
    'how do I pay',
    'can I talk to a person',
    'what services do you offer',
    'do I need to be home',
    'asdf qwer zxcv',
  ]

  it('always returns the SPEC shape', () => {
    for (const probe of probes) {
      assertShape(answerWithRules([{ role: 'user', content: probe }], data))
    }
  })

  it('uses the latest user message', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'how much is window cleaning?' },
    ]
    const res = answerWithRules(messages, data)
    expect(res.reply).toContain('£15')
  })

  it('degrades to a valid response with empty data', () => {
    const empty: BusinessData = {
      services: [],
      servicePrices: [],
      propertyBands: [],
      frequencies: [],
      bundleDiscounts: [],
      serviceAreas: [],
      faqs: [],
      settings: {
        contact: { phone: '', email: '', whatsapp: '' },
        business: { name: 'Gleaming Ant', tagline: '', area: 'Essex', domain: '' },
      },
    }
    assertShape(answerWithRules([{ role: 'user', content: 'what services do you offer?' }], empty))
    assertShape(answerWithRules([{ role: 'user', content: 'do you cover SS14?' }], empty))
  })
})

describe('answerWithRules — quote handoff extraction', () => {
  const bookMsg = (content: string): ChatResponse =>
    answerWithRules([{ role: 'user', content }], data)

  it('extracts a service on a booking intent', () => {
    const res = bookMsg('I want to book a window clean')
    expect(res.quote_draft?.services).toEqual(['window-cleaning'])
    assertShape(res)
  })

  it('extracts a service on a pricing intent too', () => {
    const res = bookMsg('how much is window cleaning?')
    expect(res.quote_draft?.services).toContain('window-cleaning')
  })

  it('infers a property band from a bedroom count', () => {
    const res = bookMsg('book me in for a 3 bed window clean')
    expect(res.quote_draft?.band_code).toBe('band_3')
  })

  it('maps 5+ bedrooms to the top band', () => {
    const res = bookMsg('quote for a 6 bedroom window clean please')
    expect(res.quote_draft?.band_code).toBe('band_5p')
  })

  it('infers a frequency from "monthly"', () => {
    const res = bookMsg('book a monthly window clean')
    expect(res.quote_draft?.frequency_code).toBe('every_4_weeks')
  })

  it('infers a one-off frequency', () => {
    const res = bookMsg('book a one-off window clean')
    expect(res.quote_draft?.frequency_code).toBe('one_off')
  })

  it('extracts an outcode as the postcode', () => {
    const res = bookMsg('can I book a window clean in SS14')
    expect(res.quote_draft?.postcode).toBe('SS14')
  })

  it('builds a full multi-service draft from the whole history', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'how much is window cleaning and gutter cleaning?' },
      { role: 'assistant', content: 'Happy to help!' },
      { role: 'user', content: 'book them for my 4 bed house in CM3, every 8 weeks' },
    ]
    const res = answerWithRules(messages, data)
    expect(res.quote_draft?.services).toEqual(['window-cleaning', 'gutter-cleaning'])
    expect(res.quote_draft?.band_code).toBe('band_4')
    expect(res.quote_draft?.frequency_code).toBe('every_8_weeks')
    expect(res.quote_draft?.postcode).toBe('CM3')
    assertShape(res)
  })

  it('adds no draft when a booking intent mentions no service', () => {
    const res = bookMsg("I'd like to book a clean")
    expect(res.quote_draft).toBeUndefined()
    assertShape(res)
  })

  it('adds no draft to a non-quote intent even if a service is named', () => {
    const res = bookMsg('are you insured for window cleaning?')
    expect(res.quote_draft).toBeUndefined()
  })
})

describe('validateQuoteDraft', () => {
  it('drops invalid band, frequency and postcode but keeps a valid service', () => {
    const draft = validateQuoteDraft(
      {
        services: ['window-cleaning', 'not-a-real-service'],
        band_code: 'band_99',
        frequency_code: 'never',
        postcode: 'NOTAPOSTCODE',
      },
      data,
    )
    expect(draft).toEqual({ services: ['window-cleaning'] })
  })

  it('keeps valid optional fields and dedupes services', () => {
    const draft = validateQuoteDraft(
      {
        services: ['window-cleaning', 'window-cleaning', 'gutter-cleaning'],
        band_code: 'band_3',
        frequency_code: 'every_8_weeks',
        postcode: 'ss14 1aa',
      },
      data,
    )
    expect(draft).toEqual({
      services: ['window-cleaning', 'gutter-cleaning'],
      band_code: 'band_3',
      frequency_code: 'every_8_weeks',
      postcode: 'ss14 1aa',
    })
  })

  it('returns undefined when no valid service survives', () => {
    expect(validateQuoteDraft({ services: ['nope'], band_code: 'band_3' }, data)).toBeUndefined()
    expect(validateQuoteDraft({ services: [] }, data)).toBeUndefined()
    expect(validateQuoteDraft(null, data)).toBeUndefined()
  })
})

describe('extractQuoteDraft (exported for the chat.ts server guarantee)', () => {
  it('builds the full draft from the live-test sentence', () => {
    const draft = extractQuoteDraft(
      [
        {
          role: 'user',
          content:
            'I want window cleaning and gutter cleaning at my 3 bed house in SS7 1AB, every 4 weeks. Can you sort me a quote?',
        },
      ],
      data,
    )
    expect(draft).toBeDefined()
    expect(draft?.services).toEqual(['window-cleaning', 'gutter-cleaning'])
    expect(draft?.band_code).toBe('band_3')
    expect(draft?.frequency_code).toBe('every_4_weeks')
    expect(draft?.postcode).toContain('SS7')
  })

  it('returns undefined when the history names no service', () => {
    const draft = extractQuoteDraft(
      [{ role: 'user', content: 'Can you sort me a quote for my 3 bed house in SS7?' }],
      data,
    )
    expect(draft).toBeUndefined()
  })
})

describe('isRoutePath', () => {
  it('accepts known static + dynamic routes', () => {
    expect(isRoutePath('/')).toBe(true)
    expect(isRoutePath('/booking')).toBe(true)
    expect(isRoutePath('/services/window-cleaning')).toBe(true)
  })

  it('rejects unknown or external paths', () => {
    expect(isRoutePath('/admin')).toBe(false)
    expect(isRoutePath('https://evil.example.com')).toBe(false)
    expect(isRoutePath('/services/Window Cleaning')).toBe(false)
  })
})
