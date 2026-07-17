// Shared domain types — the single source of truth for data shapes.
// Copied verbatim from docs/SPEC.md. Do not diverge; later phases depend on this.

export interface Service {
  id: string; slug: string; name: string;
  short_description: string; long_description: string;
  base_price: number; unit_label: string; duration_minutes: number;
  supports_frequency: boolean; price_note: string; icon: string;
  is_active: boolean; sort_order: number;
}
export interface PropertyBand { code: string; label: string; sort_order: number; }
export interface ServicePrice { id: string; service_id: string; band_code: string; price: number; }
export interface Frequency { code: string; label: string; multiplier: number; sort_order: number; is_active: boolean; }
export interface BundleDiscount { id: string; min_services: number; discount_percent: number; is_active: boolean; }
export interface ServiceArea { id: string; name: string; postcode_prefixes: string[]; surcharge: number; is_core: boolean; is_active: boolean; sort_order: number; }
export interface BusinessHours { day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null; }
export interface Faq { id: string; question: string; answer: string; category: string; sort_order: number; is_active: boolean; }
export interface BookingItem { service_id: string; slug: string; name: string; unit_price: number; line_total: number; }
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export interface Booking {
  id: string; reference: string; status: BookingStatus;
  customer_name: string; email: string; phone: string;
  address_line1: string; address_line2: string; city: string; postcode: string;
  area_name: string; property_band: string; frequency: string;
  service_date: string; start_time: string; duration_minutes: number;
  items: BookingItem[]; subtotal: number; discount_amount: number;
  surcharge_amount: number; total: number;
  customer_notes: string; admin_notes: string; created_at: string; updated_at: string;
}
export interface ContactMessage { id: string; name: string; email: string; phone: string; message: string; status: 'new'|'read'|'replied'|'archived'; created_at: string; }
export interface UnavailableSlot { on_date: string; start_time: string; end_time: string; }
export interface SiteSettings {
  contact: { phone: string; email: string; whatsapp: string };
  social: { instagram: string; facebook: string };
  booking: { slot_interval_minutes: number; min_notice_hours: number; max_days_ahead: number };
  business: { name: string; tagline: string; area: string; domain: string };
}
