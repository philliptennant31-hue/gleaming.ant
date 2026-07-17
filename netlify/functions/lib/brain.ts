// The RULES fallback for Sparkle — a pure, unit-testable intent matcher.
//
// `answerWithRules(messages, data)` inspects the latest user message and returns
// the exact SPEC ChatResponse shape ({ reply, links, suggested_replies,
// source: 'rules' }) with <=2 links and <=3 suggested replies. It ships as the
// permanent fallback (used when there's no ANTHROPIC_API_KEY and whenever the
// Claude call fails), so it must never throw and must cope with empty data.
//
// Deliberately self-contained: the postcode/area logic is re-implemented inline
// here rather than imported from src/lib (strict function-bundle isolation).

import type {
  BusinessData,
  ChatLink,
  ChatMessage,
  ChatResponse,
  Faq,
  Service,
  ServiceArea,
  ServicePrice,
} from './types'

// ---------------------------------------------------------------------------
// Route map — the only paths the assistant is ever allowed to link to.
// Shared with chat.ts, which uses isRoutePath() to filter model-authored links.
// ---------------------------------------------------------------------------

const STATIC_ROUTES = new Set<string>([
  '/',
  '/services',
  '/pricing',
  '/areas',
  '/about',
  '/faq',
  '/contact',
  '/booking',
])

const SERVICE_SLUG_RE = /^\/services\/[a-z0-9-]+$/

export function isRoutePath(path: string): boolean {
  if (typeof path !== 'string') return false
  if (STATIC_ROUTES.has(path)) return true
  return SERVICE_SLUG_RE.test(path)
}

// ---------------------------------------------------------------------------
// Keyword synonyms per known service slug. Only matched against ACTIVE services
// present in `data.services`, so inactive services (e.g. pressure washing) are
// simply never surfaced.
// ---------------------------------------------------------------------------

const SERVICE_SYNONYMS: Record<string, string[]> = {
  'window-cleaning': ['window', 'windows', 'glass', 'panes', 'pane'],
  'gutter-clearing': [
    'gutter',
    'gutters',
    'guttering',
    'downpipe',
    'downpipes',
    'down pipe',
  ],
  'fascia-soffit': ['fascia', 'fascias', 'soffit', 'soffits', 'facia'],
  'conservatory-cleaning': ['conservatory', 'conservatories'],
  'solar-panel-cleaning': ['solar', 'solar panel', 'solar panels', 'pv', 'panels'],
  'pressure-washing': [
    'pressure wash',
    'pressure washing',
    'driveway',
    'driveways',
    'patio',
    'patios',
    'jet wash',
    'jetwash',
    'decking',
  ],
}

const STOPWORDS = new Set<string>([
  'the',
  'and',
  'for',
  'you',
  'your',
  'are',
  'can',
  'will',
  'with',
  'that',
  'this',
  'have',
  'how',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'does',
  'did',
  'was',
  'were',
  'has',
  'had',
  'from',
  'about',
  'into',
  'out',
  'our',
  'get',
  'got',
  'need',
  'want',
  'like',
  'would',
  'could',
  'should',
  'please',
  'there',
  'here',
  'been',
  'not',
  'but',
  'any',
  'all',
  'its',
])

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function escapeRe(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whole-word (non-alphanumeric boundary) match for any of `terms` in `text`. */
function matches(text: string, terms: string[]): boolean {
  return terms.some((term) => {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(term)}([^a-z0-9]|$)`, 'i')
    return re.test(text)
  })
}

/** Strip `[PLACEHOLDER: ...]` / `[PLACEHOLDER]` markers and collapse whitespace. */
function sanitize(text: string): string {
  return text
    .replace(/\s*\[PLACEHOLDER:[^\]]*\]/gi, '')
    .replace(/\s*\[PLACEHOLDER\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isReal(value: string): boolean {
  return value.trim().length > 0 && !value.includes('[PLACEHOLDER')
}

/** Format pounds: £, 2dp, dropping a trailing .00 (matches src/lib formatGBP). */
function gbp(amount: number): string {
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
}

function fromPrice(service: Service, prices: ServicePrice[]): number {
  const rows = prices.filter((p) => p.service_id === service.id)
  if (rows.length === 0) return service.base_price
  return Math.min(...rows.map((r) => r.price))
}

// Words shared across most service names — too generic to identify a service.
const NAME_STOP = new Set<string>(['cleaning', 'clean', 'wash', 'washing'])

/** Find the first active service whose name/synonyms appear in the text. */
function findService(text: string, services: Service[]): Service | null {
  for (const service of services) {
    const terms = new Set<string>()
    for (const word of service.name.toLowerCase().split(/[^a-z]+/)) {
      if (word.length >= 4 && !NAME_STOP.has(word)) terms.add(word)
    }
    for (const synonym of SERVICE_SYNONYMS[service.slug] ?? []) {
      terms.add(synonym)
    }
    if (matches(text, [...terms])) return service
  }
  return null
}

/** Detect a UK outcode (e.g. SS14, CM3, EC1A) anywhere in the raw text. */
function detectOutcode(raw: string): string | null {
  const match = raw.toUpperCase().match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\b/)
  return match ? match[0] : null
}

/** Longest-matching-prefix area lookup for a normalised outcode. */
function matchArea(outcode: string, areas: ServiceArea[]): ServiceArea | null {
  let best: ServiceArea | null = null
  let bestLen = -1
  for (const area of areas) {
    for (const prefix of area.postcode_prefixes) {
      const p = prefix.toUpperCase()
      if (outcode.startsWith(p) && p.length > bestLen) {
        best = area
        bestLen = p.length
      }
    }
  }
  return best
}

function findFaq(faqs: Faq[], keywords: string[]): Faq | null {
  return (
    faqs.find((faq) => matches(faq.question.toLowerCase(), keywords)) ?? null
  )
}

/** Best fuzzy FAQ match via normalised token overlap (overlap coefficient). */
function bestFaqMatch(text: string, faqs: Faq[]): Faq | null {
  const queryTokens = new Set(tokenize(text))
  if (queryTokens.size === 0) return null

  let best: Faq | null = null
  let bestScore = 0
  let bestInter = 0
  let bestLongShared = 0

  for (const faq of faqs) {
    const faqTokens = new Set(tokenize(faq.question))
    if (faqTokens.size === 0) continue

    let inter = 0
    let longShared = 0
    for (const token of queryTokens) {
      if (faqTokens.has(token)) {
        inter += 1
        if (token.length > longShared) longShared = token.length
      }
    }
    if (inter === 0) continue

    const score = inter / Math.min(queryTokens.size, faqTokens.size)
    if (score > bestScore) {
      bestScore = score
      bestInter = inter
      bestLongShared = longShared
      best = faq
    }
  }

  // Accept a clear multi-token overlap, or a single strong, long shared token.
  const accept =
    bestInter >= 2 || (bestInter >= 1 && bestScore >= 0.6 && bestLongShared >= 5)
  return accept ? best : null
}

// ---------------------------------------------------------------------------
// Response builder — clamps links (<=2) and suggested replies (<=3), tags rules.
// ---------------------------------------------------------------------------

function reply(
  text: string,
  links: ChatLink[],
  suggestions: string[],
): ChatResponse {
  return {
    reply: text,
    links: links.filter((l) => isRoutePath(l.path)).slice(0, 2),
    suggested_replies: suggestions.filter((s) => s.trim().length > 0).slice(0, 3),
    source: 'rules',
  }
}

const LINK_QUOTE: ChatLink = { label: 'Get an instant quote', path: '/booking' }
const LINK_PRICES: ChatLink = { label: 'See prices', path: '/pricing' }
const LINK_AREAS: ChatLink = { label: 'Areas we cover', path: '/areas' }
const LINK_CONTACT: ChatLink = { label: 'Message the team', path: '/contact' }
const LINK_FAQ: ChatLink = { label: 'Read our FAQs', path: '/faq' }
const LINK_SERVICES: ChatLink = { label: 'See all services', path: '/services' }

const SUGGEST_DEFAULT = [
  'What services do you offer?',
  'How much is window cleaning?',
  'Which areas do you cover?',
]

// ---------------------------------------------------------------------------
// Intent keyword sets
// ---------------------------------------------------------------------------

const GREETING_RE =
  /^(hi|hello|hey|hiya|heya|yo|howdy|hi there|hello there|good (morning|afternoon|evening)|morning|afternoon|evening)\b/

function isGreeting(text: string): boolean {
  const trimmed = text.trim().replace(/[!.,?]/g, '')
  if (!trimmed) return false
  if (trimmed.split(/\s+/).length > 4) return false
  return GREETING_RE.test(trimmed)
}

const PRICING_KEYWORDS = [
  'price',
  'prices',
  'pricing',
  'cost',
  'costs',
  'how much',
  'how expensive',
  'expensive',
  'rate',
  'rates',
  'charge',
  'charges',
  'fee',
  'fees',
  'estimate',
]

const BOOKING_KEYWORDS = [
  'book',
  'booking',
  'quote',
  'appointment',
  'appointments',
  'arrange',
  'schedule',
  'sign up',
  'signup',
  'get started',
]

const AREA_KEYWORDS = [
  'area',
  'areas',
  'cover',
  'covered',
  'postcode',
  'post code',
  'do you come',
  'do you serve',
  'do you go',
  'near me',
  'my area',
  'where do you',
]

const FREQUENCY_KEYWORDS = [
  'how often',
  'how frequently',
  'frequency',
  'every 4 weeks',
  'every 8 weeks',
  'every four weeks',
  'every eight weeks',
  'one off',
  'one-off',
  'regular clean',
  'regularly',
  'monthly',
]

const INSURANCE_KEYWORDS = ['insured', 'insurance', 'insure', 'liability', 'covered if']

const PAYMENT_KEYWORDS = [
  'pay',
  'payment',
  'payments',
  'card',
  'cash',
  'bank transfer',
  'direct debit',
  'invoice',
  'gocardless',
]

const CONTACT_KEYWORDS = [
  'contact',
  'speak to',
  'talk to',
  'human',
  'real person',
  'call you',
  'phone number',
  'email',
  'get in touch',
  'message you',
  'reach you',
]

const SERVICES_GENERIC_KEYWORDS = [
  'services',
  'service',
  'what do you do',
  'what do you offer',
  'what can you do',
  'offer',
  'clean what',
]

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

function greetingResponse(): ChatResponse {
  return reply(
    "Hi! I'm Sparkle, the Gleaming Ant assistant. I can help with our cleaning services, prices, the areas we cover, and booking. What can I do for you?",
    [],
    SUGGEST_DEFAULT,
  )
}

function pricingResponse(text: string, data: BusinessData): ChatResponse {
  const service = findService(text, data.services)
  if (service) {
    const price = fromPrice(service, data.servicePrices)
    return reply(
      `${service.name} starts from ${gbp(price)}. The exact price depends on your property size — check the full price list or grab an instant online quote.`,
      [LINK_PRICES, LINK_QUOTE],
      ['Which areas do you cover?', 'How often should I book?', 'Book a clean'],
    )
  }
  return reply(
    "Our prices depend on the service and your property size. You'll find the full list on our pricing page, or get an instant quote in under a minute.",
    [LINK_PRICES, LINK_QUOTE],
    SUGGEST_DEFAULT,
  )
}

function bookingResponse(): ChatResponse {
  return reply(
    "Booking's easy — use our online tool for an instant quote and pick a slot that suits you. Quotes are always free.",
    [LINK_QUOTE, LINK_PRICES],
    ['Which areas do you cover?', 'What services do you offer?', 'Are you insured?'],
  )
}

function areasResponse(outcode: string | null, data: BusinessData): ChatResponse {
  if (outcode) {
    const area = matchArea(outcode, data.serviceAreas)
    if (area && area.surcharge > 0) {
      return reply(
        `We can reach ${outcode} — it's just outside our core patch, so a small travel surcharge may apply. Get an instant quote to see the full price.`,
        [LINK_QUOTE, LINK_AREAS],
        ['What services do you offer?', 'How much is window cleaning?', 'Book a clean'],
      )
    }
    if (area) {
      return reply(
        `Good news — we cover ${area.name}! Pop your details into the booking tool for an instant quote.`,
        [LINK_QUOTE, LINK_AREAS],
        ['How much is window cleaning?', 'What services do you offer?', 'Book a clean'],
      )
    }
    return reply(
      `I can't confirm from here whether we regularly cover ${outcode} — drop the team a message and we'll let you know right away.`,
      [LINK_CONTACT, LINK_AREAS],
      ['What services do you offer?', 'How much is window cleaning?', 'Book a clean'],
    )
  }

  const coreNames = data.serviceAreas
    .filter((a) => a.is_core)
    .map((a) => a.name)
  const list =
    coreNames.length > 0
      ? `${coreNames.join(', ')} and the surrounding Essex area`
      : 'Basildon, Laindon, Benfleet, Canvey Island, South Woodham Ferrers, Stanford-le-Hope and the surrounding Essex area'
  return reply(
    `We cover ${list}. Not sure about your postcode? Enter it in the booking tool or send the team a message.`,
    [LINK_AREAS, LINK_QUOTE],
    ['How much is window cleaning?', 'What services do you offer?', 'Book a clean'],
  )
}

function frequencyResponse(): ChatResponse {
  return reply(
    'Most customers go for a regular clean every 4 or 8 weeks — it keeps everything spotless and costs less per visit than a one-off. You pick the schedule when you book.',
    [LINK_QUOTE, LINK_PRICES],
    ['How much is window cleaning?', 'Which areas do you cover?', 'Book a clean'],
  )
}

function insuranceResponse(data: BusinessData): ChatResponse {
  const faq = findFaq(data.faqs, ['insured', 'insurance'])
  const answer = faq ? sanitize(faq.answer) : ''
  const text =
    answer.length >= 8
      ? answer
      : "Yes — Gleaming Ant is fully insured, so your home is protected while we work."
  return reply(text, [LINK_FAQ], [
    'What services do you offer?',
    'Which areas do you cover?',
    'Get a quote',
  ])
}

function paymentResponse(data: BusinessData): ChatResponse {
  const faq = findFaq(data.faqs, ['pay', 'payment'])
  const answer = faq ? sanitize(faq.answer) : ''
  const text =
    answer.length >= 8
      ? answer
      : "The team will confirm the payment options with you — just drop us a message and we'll sort it out."
  return reply(text, [LINK_CONTACT, LINK_FAQ], [
    'What services do you offer?',
    'Which areas do you cover?',
    'Get a quote',
  ])
}

function contactResponse(data: BusinessData): ChatResponse {
  const { phone, email } = data.settings.contact
  let text: string
  if (isReal(phone) || isReal(email)) {
    const channels = [isReal(phone) ? phone : '', isReal(email) ? email : '']
      .filter(Boolean)
      .join(' or ')
    text = `You can reach the team on ${channels}, or use our contact page and we'll come straight back to you.`
  } else {
    text =
      "The quickest way to reach the team is our contact page — leave your details and they'll get back to you soon."
  }
  return reply(text, [{ label: 'Contact us', path: '/contact' }], [
    'What services do you offer?',
    'Which areas do you cover?',
    'Get a quote',
  ])
}

function serviceResponse(text: string, data: BusinessData): ChatResponse | null {
  const service = findService(text, data.services)
  if (service) {
    const description = sanitize(service.short_description)
    const blurb = description.length >= 8 ? ` ${description}` : ''
    return reply(
      `${service.name}:${blurb} Fancy a price or want to book?`,
      [
        { label: `About ${service.name}`, path: `/services/${service.slug}` },
        LINK_QUOTE,
      ],
      [
        `How much is ${service.name.toLowerCase()}?`,
        'Which areas do you cover?',
        'Book a clean',
      ],
    )
  }
  if (matches(text, SERVICES_GENERIC_KEYWORDS)) {
    const names = data.services.map((s) => s.name)
    const list =
      names.length > 0
        ? names.join(', ')
        : 'window cleaning, gutter clearing, fascia & soffit cleaning, conservatory cleaning and solar panel cleaning'
    return reply(
      `We offer ${list}. Want details or a price on any of them?`,
      [LINK_SERVICES, LINK_QUOTE],
      ['How much is window cleaning?', 'Which areas do you cover?', 'Book a clean'],
    )
  }
  return null
}

function faqResponse(text: string, data: BusinessData): ChatResponse | null {
  const faq = bestFaqMatch(text, data.faqs)
  if (!faq) return null
  const answer = sanitize(faq.answer)
  if (answer.length < 8) return null
  return reply(answer, [LINK_FAQ, LINK_QUOTE], [
    'What services do you offer?',
    'Which areas do you cover?',
    'Book a clean',
  ])
}

function fallbackResponse(): ChatResponse {
  return reply(
    'I can help with our services, prices, areas and booking. For anything else, message the team and they’ll be happy to help.',
    [LINK_CONTACT, LINK_SERVICES],
    SUGGEST_DEFAULT,
  )
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function answerWithRules(
  messages: ChatMessage[],
  data: BusinessData,
): ChatResponse {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const raw = (lastUser?.content ?? '').trim()
  const text = raw.toLowerCase()

  if (!text) return greetingResponse()
  if (isGreeting(text)) return greetingResponse()

  if (matches(text, PRICING_KEYWORDS)) return pricingResponse(text, data)
  if (matches(text, BOOKING_KEYWORDS)) return bookingResponse()

  const outcode = detectOutcode(raw)
  const townHit = data.serviceAreas.some((area) =>
    matches(
      text,
      area.name
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((word) => word.length >= 4 && word !== 'essex'),
    ),
  )
  if (outcode || townHit || matches(text, AREA_KEYWORDS)) {
    return areasResponse(outcode, data)
  }

  if (matches(text, FREQUENCY_KEYWORDS)) return frequencyResponse()
  if (matches(text, INSURANCE_KEYWORDS)) return insuranceResponse(data)
  if (matches(text, PAYMENT_KEYWORDS)) return paymentResponse(data)
  if (matches(text, CONTACT_KEYWORDS)) return contactResponse(data)

  const serviceReply = serviceResponse(text, data)
  if (serviceReply) return serviceReply

  const faqReply = faqResponse(text, data)
  if (faqReply) return faqReply

  return fallbackResponse()
}
