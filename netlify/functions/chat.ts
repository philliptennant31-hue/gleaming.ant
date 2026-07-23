// POST /api/chat  ->  Sparkle, the Gleaming Ant site assistant.
//
// Netlify Functions v2 handler. Flow:
//   1. Validate the request body per SPEC (POST only; <=12 messages; each role
//      user|assistant; each content <=600 chars).
//   2. Load the catalogue from Supabase (degrades to empty arrays on failure).
//   3. If ANTHROPIC_API_KEY is set, try Claude with a forced JSON-schema output;
//      on ANY failure (typed SDK error or schema/parse issue) fall back to the
//      pure rules brain. Model issues never surface as a 500 to the user.
//   4. Always respond 200 with the SPEC ChatResponse shape.

import Anthropic from '@anthropic-ai/sdk'
import { loadBusinessData } from './lib/data'
import { answerWithRules, extractQuoteDraft, isRoutePath, validateQuoteDraft } from './lib/brain'
import type { BusinessData, ChatLink, ChatMessage, ChatResponse } from './lib/types'

const MAX_MESSAGES = 12
const MAX_CONTENT_CHARS = 600
const HISTORY_TURNS = 8

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

interface ValidRequest {
  messages: ChatMessage[]
  page: string
}

function validate(body: unknown): { ok: true; value: ValidRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' }
  }
  const { messages, page } = body as { messages?: unknown; page?: unknown }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'messages must be a non-empty array.' }
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: `messages must contain at most ${MAX_MESSAGES} entries.` }
  }

  const clean: ChatMessage[] = []
  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      return { ok: false, error: 'Each message must be an object.' }
    }
    const { role, content } = message as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') {
      return { ok: false, error: "Each message role must be 'user' or 'assistant'." }
    }
    if (typeof content !== 'string') {
      return { ok: false, error: 'Each message content must be a string.' }
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return { ok: false, error: `Each message must be at most ${MAX_CONTENT_CHARS} characters.` }
    }
    clean.push({ role, content })
  }

  return {
    ok: true,
    value: { messages: clean, page: typeof page === 'string' ? page : '' },
  }
}

// ---------------------------------------------------------------------------
// Claude path
// ---------------------------------------------------------------------------

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          path: { type: 'string' },
        },
        required: ['label', 'path'],
        additionalProperties: false,
      },
    },
    suggested_replies: { type: 'array', items: { type: 'string' } },
    quote_draft: {
      type: 'object',
      properties: {
        services: { type: 'array', items: { type: 'string' } },
        band_code: { type: 'string' },
        frequency_code: { type: 'string' },
        postcode: { type: 'string' },
      },
      required: ['services'],
      additionalProperties: false,
    },
  },
  required: ['reply', 'links', 'suggested_replies'],
  additionalProperties: false,
}

const ROUTE_MAP = [
  '/            Home',
  '/services    All services',
  '/services/:slug  A single service (slug from the data below)',
  '/pricing     Full price list (services x property bands)',
  '/areas       Areas covered',
  '/about       About Gleaming Ant',
  '/faq         Frequently asked questions',
  '/contact     Contact form + details',
  '/booking     Instant online quote + booking wizard',
].join('\n')

function stripPlaceholders(text: string): string {
  return text
    .replace(/\s*\[PLACEHOLDER:[^\]]*\]/gi, '')
    .replace(/\s*\[PLACEHOLDER\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isReal(value: string): boolean {
  return value.trim().length > 0 && !value.includes('[PLACEHOLDER')
}

function buildSystemPrompt(data: BusinessData): string {
  const { settings } = data

  const services = data.services.map((service) => {
    const prices = data.servicePrices
      .filter((p) => p.service_id === service.id)
      .map((p) => {
        const band = data.propertyBands.find((b) => b.code === p.band_code)
        return `${band ? band.label : p.band_code}: £${p.price}`
      })
    const from = data.servicePrices
      .filter((p) => p.service_id === service.id)
      .map((p) => p.price)
    const fromPrice = from.length ? Math.min(...from) : service.base_price
    return {
      name: service.name,
      slug: service.slug,
      summary: stripPlaceholders(service.short_description),
      from_price: `£${fromPrice}`,
      unit: service.unit_label,
      supports_regular_pricing: service.supports_frequency,
      prices_by_band: prices,
      note: stripPlaceholders(service.price_note),
    }
  })

  const frequencies = data.frequencies.map((f) => `${f.label} (x${f.multiplier})`)
  const bundles = data.bundleDiscounts.map(
    (b) => `${b.discount_percent}% off when booking ${b.min_services}+ services`,
  )
  const areas = data.serviceAreas.map((a) => ({
    name: a.name,
    postcodes: a.postcode_prefixes,
    surcharge: a.surcharge > 0 ? `£${a.surcharge} travel surcharge` : 'no surcharge',
    core: a.is_core,
  }))
  const faqs = data.faqs.map((f) => ({
    q: f.question,
    a: stripPlaceholders(f.answer),
  }))

  const contactLines: string[] = []
  if (isReal(settings.contact.phone)) contactLines.push(`phone: ${settings.contact.phone}`)
  if (isReal(settings.contact.email)) contactLines.push(`email: ${settings.contact.email}`)
  if (isReal(settings.contact.whatsapp)) contactLines.push(`whatsapp: ${settings.contact.whatsapp}`)
  const contact =
    contactLines.length > 0
      ? contactLines.join(', ')
      : 'not yet published, so direct people to the /contact page'

  return [
    "You are Sparkle, the friendly assistant for Gleaming Ant, a window & exterior cleaning company in Essex, UK.",
    'Your job is to help visitors with services, prices, coverage areas, and booking.',
    '',
    `Business: ${settings.business.name}, ${settings.business.tagline}. Serves ${settings.business.area}.`,
    `Contact: ${contact}`,
    '',
    'SERVICES (JSON):',
    JSON.stringify(services),
    '',
    `Property bands: ${data.propertyBands.map((b) => b.label).join(', ') || 'unavailable'}`,
    `Frequencies: ${frequencies.join(', ') || 'unavailable'}`,
    `Bundle discounts: ${bundles.join('; ') || 'none'}`,
    '',
    'AREAS (JSON):',
    JSON.stringify(areas),
    '',
    'FAQs (JSON):',
    JSON.stringify(faqs),
    '',
    'ROUTE MAP (links only ever point to these paths; a link is never the answer itself — see ANSWER-FIRST POLICY):',
    ROUTE_MAP,
    '',
    'ANSWER-FIRST POLICY (this is the whole point of the chat — read carefully):',
    '- The chat is a full alternative to browsing the site. Answer every question you can from the data above (coverage/areas/postcode checks, prices, services and what is included, frequencies, bundles and discounts, contact details, FAQ content) DIRECTLY in the reply. Never tell a visitor to go to a page or the booking tool to GET an answer you can already give.',
    '- Coverage without a postcode: if they named a town you can place, confirm it at town level, then invite them to type their postcode right here ("tell me your postcode and I will check it now"). Never frame the booking tool as the way to check coverage.',
    '- Coverage with a postcode: answer decisively from the AREAS prefixes — name the area and state the travel surcharge (or that there is none). Do not defer a coverage answer to the booking tool.',
    '- Unknown facts (anything genuinely not in the data, e.g. exact hours or payment methods still to be confirmed): say honestly the team will confirm, AND include the real contact details (phone/WhatsApp/email from the Contact line above) inline in the reply. A /contact link may supplement but never replaces the details.',
    '- Links are supplements, never the answer. Only add a link when: (a) you are handing off a ready or price-ready quote (the automatic amber CTA built from quote_draft — see QUOTE HANDOFF); (b) the visitor explicitly asks where a page is or to see one; or (c) it is a deep-dive AFTER a complete answer (e.g. the service page beneath a full explanation). The reply must stand on its own without the link, and a link label must never imply the answer lives behind it ("Check your postcode in the booking tool" is banned; "See the Window Cleaning page" beneath a full answer is fine).',
    '- Suggested replies are things the VISITOR would tap to say next ("How much is window cleaning?", "Do you cover CM3?", "I am ready to book"), never navigation instructions ("Check your postcode in the booking tool" as a suggestion is banned).',
    '',
    'QUOTE HANDOFF (the ONE place a redirect is right — completing a booking; everything else is answered in chat per ANSWER-FIRST POLICY):',
    '- When a visitor wants a price or to book, help them start a quote. Gather what is missing conversationally, ONE thing at a time, in this order: which service(s), property size (bedrooms), how often, and postcode.',
    '- Use the exact CODES below when you record a choice (never the labels):',
    `  Property size (band_code): ${data.propertyBands.map((b) => `${b.code} = ${b.label}`).join('; ') || 'unavailable'}`,
    `  How often (frequency_code): ${data.frequencies.map((f) => `${f.code} = ${f.label}`).join('; ') || 'unavailable'}`,
    '  Services: use the "slug" of each service from the SERVICES data above.',
    '- Infer codes where you can: "3 bed semi" -> band_3; "two bed flat" -> band_1_2; "5 bedroom" -> band_5p; "every month"/"monthly" -> every_4_weeks; "every 8 weeks" -> every_8_weeks; "one-off"/"just once" -> one_off.',
    '- Once the visitor has named at least one service AND wants a price or to book, you MUST include the `quote_draft` object. Never skip it: put everything gathered so far in it (services is required; add band_code, frequency_code and postcode when known), using the exact slugs and codes listed above. Keep asking for the next missing detail in your reply.',
    '- Never use the label "Continue your quote" on an ordinary link. That button is generated automatically from quote_draft, so a link with that label but no draft is a broken handoff. If you add a link alongside the draft, give it a different label.',
    '- Never block the handoff on missing fields. A partial draft is fine. Only include quote_draft once the visitor actually wants a price or to book.',
    '- While handing off (any reply that includes quote_draft): do not attach page links, keep the reply to the single next question, and make suggested_replies short ANSWERS to that question (e.g. "3 bedrooms", "Every 4 weeks", "One-off"), never new questions.',
    '',
    'STRICT RULES:',
    '- Only discuss Gleaming Ant, its services, prices, areas, and booking. Politely decline anything else and steer back.',
    '- Never invent prices, policies, hours, or contact details. Use ONLY the data above. If a fact is not there, say the team will confirm it and give the real contact details inline (see ANSWER-FIRST POLICY); never send the visitor to a page or the booking tool to get an answer.',
    '- Write the reply in full and ready to show a visitor as-is. Never emit filler or placeholder text such as "placeholder", "TBD" or "N/A"; if you lack a detail, say the team will confirm it.',
    '- Quote prices as the "from" price and note the exact price depends on property size; offer to work out their exact price right here if they share the details (the amber CTA handles the booking handoff). Do not tell them to go to the booking tool just to see a price.',
    '- Links must come from the route map only. Use /services/:slug with a real slug from the data.',
    '- Link labels must read as navigation ("See Window Cleaning", "Open the price list", "How pricing works"), never a bare service name that a visitor could mistake for a reply option to tap, and never a label that implies the answer is behind the link.',
    '- Keep replies under 120 words, warm and plain-spoken UK English (say "we" and "your"; contractions welcome). No corporate filler, no invented claims.',
    '- Never use em dashes (use commas or separate sentences). Write plain, human UK English: no AI-typical phrasing, no rhetorical triads, no "it is not X, it is Y" constructions, and no brochure words such as seamless, elevate, or delve.',
    '- Provide at most 2 links and at most 3 short suggested replies. Normally each is a question a visitor might ask next; during a quote handoff they are instead short ANSWERS to the question you just asked (e.g. "3 bedrooms", "Every 4 weeks", "One-off").',
    '- Respond ONLY with the required JSON object. Include quote_draft only when handing a visitor into a quote (see QUOTE HANDOFF).',
  ].join('\n')
}

function toAiHistory(messages: ChatMessage[]): Anthropic.MessageParam[] {
  const history = messages.slice(-HISTORY_TURNS)
  // The API requires the first message to be from the user; truncation can
  // otherwise land mid-pair and start the history with an assistant turn.
  while (history.length > 0 && history[0].role !== 'user') history.shift()
  return history.map((m) => ({ role: m.role, content: m.content }))
}

// A structured-output model occasionally emits a degenerate `reply` — a literal
// "placeholder"/"TBD", or a stray fragment — instead of real prose (observed in
// live testing). Treat these as a failed generation: throwing here lets the
// handler's catch fall back to the rules brain, which always returns a proper
// answer. Rejects a small case-insensitive set of filler tokens, or any reply
// too short to be a real sentence.
const DEGENERATE_REPLIES = new Set<string>([
  'placeholder',
  'todo',
  'tbd',
  'n/a',
  'na',
  '...',
  '-',
  'xxx',
])

export function isDegenerateReply(reply: string): boolean {
  const trimmed = reply.trim()
  if (trimmed.length < 8) return true
  return DEGENERATE_REPLIES.has(trimmed.toLowerCase())
}

function coerceAiResponse(parsed: unknown, data: BusinessData): ChatResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response is not an object')
  }
  const obj = parsed as Record<string, unknown>

  const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
  if (!reply) throw new Error('AI response has no reply')
  if (isDegenerateReply(reply)) {
    console.error(
      `Sparkle: degenerate AI reply rejected (${JSON.stringify(reply)}) — using rules fallback`,
    )
    throw new Error(`AI response reply is degenerate: ${JSON.stringify(reply)}`)
  }

  const links: ChatLink[] = []
  if (Array.isArray(obj.links)) {
    for (const raw of obj.links) {
      if (links.length >= 2) break
      if (!raw || typeof raw !== 'object') continue
      const { label, path } = raw as { label?: unknown; path?: unknown }
      if (typeof label === 'string' && typeof path === 'string' && label && isRoutePath(path)) {
        links.push({ label, path })
      }
    }
  }

  const suggested_replies = Array.isArray(obj.suggested_replies)
    ? obj.suggested_replies
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 3)
    : []

  const result: ChatResponse = { reply, links, suggested_replies, source: 'ai' }

  // Validate the model's draft against live data before trusting it: real
  // active slugs only, valid band/frequency codes, postcode-ish postcode, and
  // dropped entirely if no service survives.
  const quote_draft = validateQuoteDraft(obj.quote_draft, data)
  if (quote_draft) result.quote_draft = quote_draft

  return result
}

/**
 * Server-side guarantee for the quote handoff. Models sometimes skip the
 * optional `quote_draft` schema field even mid-handoff, or send it with only
 * the services filled while the history plainly names the property size,
 * frequency or postcode (both observed in live testing). The rules-side
 * extraction over the same history fills whatever is missing: the AI's own
 * values always win per field, extraction only tops up gaps. Never throws:
 * on any error the response is returned unchanged.
 */
function ensureQuoteDraft(
  result: ChatResponse,
  messages: ChatMessage[],
  data: BusinessData,
): ChatResponse {
  try {
    const extracted = extractQuoteDraft(messages, data)
    if (!result.quote_draft) {
      return extracted ? { ...result, quote_draft: extracted } : result
    }
    if (!extracted) return result
    return {
      ...result,
      quote_draft: {
        services: result.quote_draft.services,
        band_code: result.quote_draft.band_code ?? extracted.band_code,
        frequency_code: result.quote_draft.frequency_code ?? extracted.frequency_code,
        postcode: result.quote_draft.postcode ?? extracted.postcode,
      },
    }
  } catch {
    return result
  }
}

async function answerWithClaude(
  messages: ChatMessage[],
  data: BusinessData,
): Promise<ChatResponse> {
  const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment
  const response = await client.messages.create({
    model: process.env.CHAT_MODEL || 'claude-opus-4-8',
    max_tokens: 700,
    system: buildSystemPrompt(data),
    messages: toAiHistory(messages),
    output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
  })

  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim()

  return coerceAiResponse(JSON.parse(text), data)
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'content-type': 'application/json; charset=utf-8', Allow: 'POST' },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const validation = validate(body)
  if (!validation.ok) {
    return json({ error: validation.error }, 400)
  }
  const { messages } = validation.value

  const data = await loadBusinessData()

  let result: ChatResponse
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = ensureQuoteDraft(await answerWithClaude(messages, data), messages, data)
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        console.error(`Sparkle: Claude API error (${error.status ?? 'n/a'}) — using rules fallback`, error.message)
      } else {
        console.error('Sparkle: Claude call failed — using rules fallback', error)
      }
      // The fallback must not drop a handoff in progress: top up the rules
      // answer with the draft extracted from history, same as the AI path.
      result = ensureQuoteDraft(answerWithRules(messages, data), messages, data)
    }
  } else {
    result = ensureQuoteDraft(answerWithRules(messages, data), messages, data)
  }

  return json(result, 200)
}
