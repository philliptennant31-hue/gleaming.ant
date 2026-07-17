import { useEffect, useState, type ReactNode } from 'react'
import { Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../lib/useAsync'
import type { SiteSettings } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import { LoadingState, ErrorState } from '../../components/ui/states'
import {
  AdminHeading,
  ConfirmDialog,
  DangerButton,
  TableCard,
  tdClass,
  thClass,
  useToast,
} from '../../components/admin/primitives'
import {
  addAdminEmail,
  fetchAdminEmails,
  fetchSettings,
  removeAdminEmail,
  upsertSetting,
  type AdminEmail,
} from '../../components/admin/data'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SettingsData {
  settings: SiteSettings
  raw: Record<string, Record<string, unknown>>
  admins: AdminEmail[]
  currentEmail: string
}

export default function SettingsPage() {
  const { data, loading, error, reload } = useAsync<SettingsData>(async () => {
    const [{ settings, raw }, admins, sessionRes] = await Promise.all([
      fetchSettings(),
      fetchAdminEmails(),
      supabase.auth.getSession(),
    ])
    return {
      settings,
      raw,
      admins,
      currentEmail: sessionRes.data.session?.user?.email?.toLowerCase() ?? '',
    }
  }, [])

  return (
    <div className="space-y-8">
      <AdminHeading title="Settings" description="Contact details, links, booking rules and who can sign in." />

      {loading && <LoadingState message="Loading settings…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactForm settings={data.settings} raw={data.raw.contact} onSaved={reload} />
          <SocialForm settings={data.settings} raw={data.raw.social} onSaved={reload} />
          <BookingForm settings={data.settings} raw={data.raw.booking} onSaved={reload} />
          <BusinessForm settings={data.settings} raw={data.raw.business} onSaved={reload} />
          <div className="lg:col-span-2">
            <AdminEmailsManager admins={data.admins} currentEmail={data.currentEmail} onSaved={reload} />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared card + save-button helpers
// ---------------------------------------------------------------------------
function SettingsCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-pane bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SaveButton({ saving, disabled }: { saving: boolean; disabled?: boolean }) {
  return (
    <Button
      type="submit"
      size="sm"
      variant="secondary"
      disabled={saving || disabled}
      leftIcon={saving ? <Spinner size={16} className="text-teal-deep" /> : undefined}
    >
      {saving ? 'Saving…' : 'Save'}
    </Button>
  )
}

function useSettingSaver(key: string, onSaved: () => void) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  async function save(value: Record<string, unknown>) {
    setSaving(true)
    try {
      await upsertSetting(key, value)
      toast.show('Settings saved.')
      onSaved()
    } catch {
      toast.show('Could not save settings. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }
  return { saving, save }
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------
function ContactForm({
  settings,
  raw,
  onSaved,
}: {
  settings: SiteSettings
  raw: Record<string, unknown> | undefined
  onSaved: () => void
}) {
  const { saving, save } = useSettingSaver('contact', onSaved)
  const [phone, setPhone] = useState(settings.contact.phone)
  const [email, setEmail] = useState(settings.contact.email)
  const [whatsapp, setWhatsapp] = useState(settings.contact.whatsapp)

  useEffect(() => {
    setPhone(settings.contact.phone)
    setEmail(settings.contact.email)
    setWhatsapp(settings.contact.whatsapp)
  }, [settings])

  return (
    <SettingsCard title="Contact details" description="Shown in the footer and on the contact page.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void save({ ...raw, phone: phone.trim(), email: email.trim(), whatsapp: whatsapp.trim() })
        }}
      >
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <div className="flex justify-end">
          <SaveButton saving={saving} />
        </div>
      </form>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------
function SocialForm({
  settings,
  raw,
  onSaved,
}: {
  settings: SiteSettings
  raw: Record<string, unknown> | undefined
  onSaved: () => void
}) {
  const { saving, save } = useSettingSaver('social', onSaved)
  const [instagram, setInstagram] = useState(settings.social.instagram)
  const [facebook, setFacebook] = useState(settings.social.facebook)

  useEffect(() => {
    setInstagram(settings.social.instagram)
    setFacebook(settings.social.facebook)
  }, [settings])

  return (
    <SettingsCard title="Social links" description="Links to your social profiles.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void save({ ...raw, instagram: instagram.trim(), facebook: facebook.trim() })
        }}
      >
        <Input label="Instagram URL" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <Input label="Facebook URL" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        <div className="flex justify-end">
          <SaveButton saving={saving} />
        </div>
      </form>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------------------
// Booking rules
// ---------------------------------------------------------------------------
function BookingForm({
  settings,
  raw,
  onSaved,
}: {
  settings: SiteSettings
  raw: Record<string, unknown> | undefined
  onSaved: () => void
}) {
  const { saving, save } = useSettingSaver('booking', onSaved)
  const [slot, setSlot] = useState(String(settings.booking.slot_interval_minutes))
  const [notice, setNotice] = useState(String(settings.booking.min_notice_hours))
  const [maxDays, setMaxDays] = useState(String(settings.booking.max_days_ahead))

  useEffect(() => {
    setSlot(String(settings.booking.slot_interval_minutes))
    setNotice(String(settings.booking.min_notice_hours))
    setMaxDays(String(settings.booking.max_days_ahead))
  }, [settings])

  return (
    <SettingsCard title="Booking rules" description="How the booking tool offers slots.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void save({
            ...raw,
            slot_interval_minutes: Math.max(1, Math.round(Number(slot) || 0)),
            min_notice_hours: Math.max(0, Math.round(Number(notice) || 0)),
            max_days_ahead: Math.max(1, Math.round(Number(maxDays) || 0)),
          })
        }}
      >
        <Input
          label="Slot interval (minutes)"
          type="number"
          min="1"
          step="5"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
        />
        <Input
          label="Minimum notice (hours)"
          type="number"
          min="0"
          step="1"
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
        />
        <Input
          label="Max days ahead"
          type="number"
          min="1"
          step="1"
          value={maxDays}
          onChange={(e) => setMaxDays(e.target.value)}
        />
        <div className="flex justify-end">
          <SaveButton saving={saving} />
        </div>
      </form>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------------------
// Business info
// ---------------------------------------------------------------------------
function BusinessForm({
  settings,
  raw,
  onSaved,
}: {
  settings: SiteSettings
  raw: Record<string, unknown> | undefined
  onSaved: () => void
}) {
  const { saving, save } = useSettingSaver('business', onSaved)
  const [name, setName] = useState(settings.business.name)
  const [tagline, setTagline] = useState(settings.business.tagline)
  const [area, setArea] = useState(settings.business.area)
  const [domain, setDomain] = useState(settings.business.domain)

  useEffect(() => {
    setName(settings.business.name)
    setTagline(settings.business.tagline)
    setArea(settings.business.area)
    setDomain(settings.business.domain)
  }, [settings])

  return (
    <SettingsCard title="Business info" description="Name, tagline and area used across the site.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void save({
            ...raw,
            name: name.trim(),
            tagline: tagline.trim(),
            area: area.trim(),
            domain: domain.trim(),
          })
        }}
      >
        <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} />
        <Input label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <div className="flex justify-end">
          <SaveButton saving={saving} />
        </div>
      </form>
    </SettingsCard>
  )
}

// ---------------------------------------------------------------------------
// Admin emails
// ---------------------------------------------------------------------------
function AdminEmailsManager({
  admins,
  currentEmail,
  onSaved,
}: {
  admins: AdminEmail[]
  currentEmail: string
  onSaved: () => void
}) {
  const toast = useToast()
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [toRemove, setToRemove] = useState<AdminEmail | null>(null)
  const [removing, setRemoving] = useState(false)

  async function add() {
    const email = newEmail.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) {
      toast.show('Enter a valid email address.', 'error')
      return
    }
    if (admins.some((a) => a.email.toLowerCase() === email)) {
      toast.show('That email is already an admin.', 'info')
      return
    }
    setAdding(true)
    try {
      await addAdminEmail(email)
      toast.show('Admin added.')
      setNewEmail('')
      onSaved()
    } catch {
      toast.show('Could not add that admin. Try again.', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function confirmRemove() {
    if (!toRemove) return
    if (toRemove.email.toLowerCase() === currentEmail) {
      toast.show('You can’t remove your own access.', 'error')
      setToRemove(null)
      return
    }
    setRemoving(true)
    try {
      await removeAdminEmail(toRemove.email)
      toast.show('Admin removed.')
      onSaved()
    } catch {
      toast.show('Could not remove that admin. Try again.', 'error')
    } finally {
      setRemoving(false)
      setToRemove(null)
    }
  }

  return (
    <SettingsCard
      title="Who can sign in"
      description="Only these emails can access the dashboard via a magic link."
    >
      <div className="space-y-4">
        <TableCard minWidth={420}>
          <thead>
            <tr className="border-b border-pane bg-pane/30">
              <th className={thClass}>Email</th>
              <th className={thClass}>Added</th>
              <th className={`${thClass} text-right`}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const isSelf = admin.email.toLowerCase() === currentEmail
              return (
                <tr key={admin.email} className="border-b border-pane/60 last:border-0">
                  <td className={`${tdClass} font-mono text-xs`}>
                    <span className="flex items-center gap-2">
                      {admin.email}
                      {isSelf && <Badge tone="teal" size="sm">You</Badge>}
                    </span>
                  </td>
                  <td className={`${tdClass} text-ink-soft`}>
                    {admin.added_at ? new Date(admin.added_at).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <DangerButton
                      onClick={() => setToRemove(admin)}
                      disabled={isSelf}
                      title={isSelf ? 'You can’t remove your own access' : `Remove ${admin.email}`}
                      aria-label={`Remove ${admin.email}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </DangerButton>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableCard>

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <Input
              label="Add an admin email"
              type="email"
              placeholder="name@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={adding}
            leftIcon={adding ? <Spinner size={16} className="text-ink" /> : <Plus className="h-4 w-4" />}
          >
            {adding ? 'Adding…' : 'Add admin'}
          </Button>
        </form>

        <p className="flex items-start gap-2 text-xs text-ink-soft">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-deep" aria-hidden="true" />
          New admins sign in with a magic link, no password to set. They’ll appear here once added.
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(toRemove)}
        title="Remove this admin?"
        message={
          <>
            <span className="font-mono">{toRemove?.email}</span> will no longer be able to sign in to the dashboard.
          </>
        }
        confirmLabel="Remove admin"
        busy={removing}
        onCancel={() => setToRemove(null)}
        onConfirm={() => void confirmRemove()}
      />
    </SettingsCard>
  )
}
