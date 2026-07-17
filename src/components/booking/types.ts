// Shared types for the booking wizard (Phase 2). The wizard state lives in
// BookingPage; these shapes are passed down to the step components.

import type {
  BundleDiscount,
  BusinessHours,
  Frequency,
  PropertyBand,
  Service,
  ServiceArea,
  ServicePrice,
} from '../../lib/types'

/** Everything the wizard fetches once up front. A superset of pricing's QuoteData. */
export interface CatalogueData {
  services: Service[]
  bands: PropertyBand[]
  prices: ServicePrice[]
  frequencies: Frequency[]
  bundles: BundleDiscount[]
  areas: ServiceArea[]
  hours: BusinessHours[]
}

export interface AddressState {
  line1: string
  line2: string
  city: string
  postcode: string
}

export interface DetailsState {
  name: string
  email: string
  phone: string
  notes: string
}

/** The wizard step numbers, in order. */
export const STEP_LABELS = ['Services', 'Property', 'Address', 'Date & time', 'Your details'] as const
export const TOTAL_STEPS = STEP_LABELS.length
