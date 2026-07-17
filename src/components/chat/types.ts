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
