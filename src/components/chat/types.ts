// Chat wire + view types for the Sparkle widget. These mirror the serverless
// function's response shape (netlify/functions/lib/types.ts) across the HTTP
// boundary — a small, deliberate duplication.

export type ChatRole = 'user' | 'assistant'

export interface ChatLink {
  label: string
  path: string
}

export interface ChatResponse {
  reply: string
  links: ChatLink[]
  suggested_replies: string[]
  source: 'ai' | 'rules'
}

export interface DisplayMessage {
  id: string
  role: ChatRole
  content: string
  links?: ChatLink[]
  suggestions?: string[]
  /** UI-only messages (greeting, error notices) — never sent to the API. */
  local?: boolean
}
