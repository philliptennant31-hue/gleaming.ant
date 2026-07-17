import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { SiteSettings } from './types'

// Sane defaults used while loading and as a fallback if the fetch fails.
// Contact details are intentionally [PLACEHOLDER] until the client confirms.
export const DEFAULT_SETTINGS: SiteSettings = {
  contact: { phone: '[PLACEHOLDER]', email: '[PLACEHOLDER]', whatsapp: '[PLACEHOLDER]' },
  social: { instagram: 'https://www.instagram.com/gleaming.ant/', facebook: '' },
  booking: { slot_interval_minutes: 30, min_notice_hours: 24, max_days_ahead: 60 },
  business: {
    name: 'Gleaming Ant',
    tagline: 'Window & Exterior Cleaning',
    area: 'Essex',
    domain: 'gleamingant.co.uk',
  },
}

interface SettingsRow {
  key: string
  value: unknown
}

/** Merge site_settings rows (key/jsonb) onto the typed defaults. */
function assembleSettings(rows: SettingsRow[]): SiteSettings {
  const byKey = new Map(rows.map((r) => [r.key, r.value as Record<string, unknown>]))
  return {
    contact: { ...DEFAULT_SETTINGS.contact, ...(byKey.get('contact') ?? {}) },
    social: { ...DEFAULT_SETTINGS.social, ...(byKey.get('social') ?? {}) },
    booking: { ...DEFAULT_SETTINGS.booking, ...(byKey.get('booking') ?? {}) },
    business: { ...DEFAULT_SETTINGS.business, ...(byKey.get('business') ?? {}) },
  }
}

export interface UseSiteSettings {
  settings: SiteSettings
  loading: boolean
  error: boolean
}

/**
 * Fetch every site_settings row once and expose them as a typed SiteSettings
 * object. Consumers always get a usable value — defaults render immediately
 * and are replaced when the real data arrives.
 */
export function useSiteSettings(): UseSiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error: err } = await supabase.from('site_settings').select('key, value')
      if (!active) return
      if (err || !data) {
        setError(true)
        setLoading(false)
        return
      }
      setSettings(assembleSettings(data as SettingsRow[]))
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  return { settings, loading, error }
}
