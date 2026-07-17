// Server-side domain types for "Sparkle", the Gleaming Ant assistant.
//
// These mirror the relevant subset of src/lib/types.ts but are kept local so
// the serverless bundle has zero dependency on the client source tree (strict
// file ownership + a clean esbuild bundle). The chat wire shapes are duplicated
// on the client in src/components/chat/types.ts — they cross an HTTP boundary,
// so a small deliberate duplication is correct.

export interface Service {
  id: string
  slug: string
  name: string
  short_description: string
  long_description: string
  base_price: number
  unit_label: string
  duration_minutes: number
  supports_frequency: boolean
  price_note: string
  icon: string
  is_active: boolean
  sort_order: number
}

export interface PropertyBand {
  code: string
  label: string
  sort_order: number
}

export interface ServicePrice {
  id: string
  service_id: string
  band_code: string
  price: number
}

export interface Frequency {
  code: string
  label: string
  multiplier: number
  sort_order: number
  is_active: boolean
}

export interface BundleDiscount {
  id: string
  min_services: number
  discount_percent: number
  is_active: boolean
}

export interface ServiceArea {
  id: string
  name: string
  postcode_prefixes: string[]
  surcharge: number
  is_core: boolean
  is_active: boolean
  sort_order: number
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
  is_active: boolean
}

export interface ContactSettings {
  phone: string
  email: string
  whatsapp: string
}

export interface BusinessSettings {
  name: string
  tagline: string
  area: string
  domain: string
}

export interface SiteSettings {
  contact: ContactSettings
  business: BusinessSettings
}

/** Everything the assistant needs to answer, loaded once per request. */
export interface BusinessData {
  services: Service[]
  servicePrices: ServicePrice[]
  propertyBands: PropertyBand[]
  frequencies: Frequency[]
  bundleDiscounts: BundleDiscount[]
  serviceAreas: ServiceArea[]
  faqs: Faq[]
  settings: SiteSettings
}

// ---- Chat wire shapes (shared conceptually with the widget over HTTP) ----

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

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
