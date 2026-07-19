// Chat wire + view types for the Sparkle widget. These mirror the serverless
// function's response shape (netlify/functions/lib/types.ts) across the HTTP
// boundary — a small, deliberate duplication.

export type ChatRole = 'user' | 'assistant'

export interface ChatLink {
  label: string
  path: string
}

/** A pre-filled quote handoff carried on a response (see the serverless types). */
export interface QuoteDraft {
  services: string[]
  band_code?: string
  frequency_code?: string
  postcode?: string
}

export interface ChatResponse {
  reply: string
  links: ChatLink[]
  suggested_replies: string[]
  source: 'ai' | 'rules'
  quote_draft?: QuoteDraft
}

export interface DisplayMessage {
  id: string
  role: ChatRole
  content: string
  links?: ChatLink[]
  suggestions?: string[]
  /** Present when this assistant turn can hand the visitor into the wizard. */
  quoteDraft?: QuoteDraft
  /** UI-only messages (greeting, error notices) — never sent to the API. */
  local?: boolean
}

/**
 * How complete a quote draft is, for the chat handoff UI. 'ready' once the
 * visitor has named a service AND a property size (band_code) — enough for the
 * booking wizard to land on a real price — which earns the prominent CTA.
 * Anything less is 'partial': offer only a quiet "skip ahead" link so it never
 * competes with the question the visitor is still answering. Pure + exported so
 * it can be unit-tested without rendering the widget.
 */
export function draftReadiness(draft: QuoteDraft): 'ready' | 'partial' {
  const hasService =
    Array.isArray(draft.services) &&
    draft.services.some((s) => typeof s === 'string' && s.trim().length > 0)
  const hasBand = typeof draft.band_code === 'string' && draft.band_code.trim().length > 0
  return hasService && hasBand ? 'ready' : 'partial'
}
