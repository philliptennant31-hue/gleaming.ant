import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import type { Service } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { fieldLabel } from '../../components/ui/field'
import { Modal, Switch, useToast } from './primitives'
import { createService, slugify, updateService, type ServiceDraft } from './data'

const ICON_OPTIONS = ['window', 'gutter', 'fascia', 'conservatory', 'solar', 'pressure', 'sparkles']

interface Draft {
  name: string
  slug: string
  short_description: string
  long_description: string
  base_price: string
  unit_label: string
  duration_minutes: string
  price_note: string
  icon: string
  supports_frequency: boolean
  is_active: boolean
  sort_order: string
}

function toDraft(service: Service | null): Draft {
  return {
    name: service?.name ?? '',
    slug: service?.slug ?? '',
    short_description: service?.short_description ?? '',
    long_description: service?.long_description ?? '',
    base_price: service ? String(service.base_price) : '0',
    unit_label: service?.unit_label ?? 'per visit',
    duration_minutes: service ? String(service.duration_minutes) : '60',
    price_note: service?.price_note ?? '',
    icon: service?.icon ?? 'sparkles',
    supports_frequency: service?.supports_frequency ?? false,
    is_active: service?.is_active ?? true,
    sort_order: service ? String(service.sort_order) : '0',
  }
}

export function ServiceModal({
  open,
  service,
  onClose,
  onSaved,
}: {
  open: boolean
  service: Service | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState<Draft>(() => toDraft(service))
  const [error, setError] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(toDraft(service))
      setError(undefined)
    }
  }, [open, service])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    const name = draft.name.trim()
    if (!name) {
      setError('A service needs a name.')
      return
    }
    const slug = draft.slug.trim() || slugify(name)
    if (!slug) {
      setError('Could not build a slug — add a name with letters or numbers.')
      return
    }
    const payload: ServiceDraft = {
      name,
      slug,
      short_description: draft.short_description.trim(),
      long_description: draft.long_description.trim(),
      base_price: Number(draft.base_price) || 0,
      unit_label: draft.unit_label.trim() || 'per visit',
      duration_minutes: Math.max(0, Math.round(Number(draft.duration_minutes) || 0)),
      price_note: draft.price_note.trim(),
      icon: draft.icon,
      supports_frequency: draft.supports_frequency,
      is_active: draft.is_active,
      sort_order: Math.round(Number(draft.sort_order) || 0),
    }

    setSaving(true)
    setError(undefined)
    try {
      if (service) {
        await updateService(service.id, payload)
        toast.show('Service updated.')
      } else {
        await createService(payload)
        toast.show('Service created.')
      }
      onSaved()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the service.'
      setError(/duplicate|unique/i.test(message) ? 'That slug is already in use — choose another.' : message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={service ? 'Edit service' : 'New service'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void save()}
            disabled={saving}
            leftIcon={saving ? <Spinner size={16} className="text-ink" /> : undefined}
          >
            {saving ? 'Saving…' : service ? 'Save changes' : 'Create service'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Name"
            required
            value={draft.name}
            onChange={(e) => {
              const value = e.target.value
              setDraft((d) => ({
                // keep slug in sync while creating, until the user edits it
                ...d,
                name: value,
                slug: service || d.slug !== slugify(d.name) ? d.slug : slugify(value),
              }))
            }}
          />
          <Input
            label="Slug"
            hint="Used in the URL, e.g. window-cleaning"
            value={draft.slug}
            onChange={(e) => set('slug', e.target.value)}
          />
        </div>

        <Input
          label="Short description"
          value={draft.short_description}
          onChange={(e) => set('short_description', e.target.value)}
        />

        <Textarea
          label="Long description"
          rows={4}
          value={draft.long_description}
          onChange={(e) => set('long_description', e.target.value)}
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="From price (£)"
            type="number"
            min="0"
            step="0.01"
            value={draft.base_price}
            onChange={(e) => set('base_price', e.target.value)}
          />
          <Input
            label="Unit label"
            value={draft.unit_label}
            onChange={(e) => set('unit_label', e.target.value)}
          />
          <Input
            label="Duration (min)"
            type="number"
            min="0"
            step="5"
            value={draft.duration_minutes}
            onChange={(e) => set('duration_minutes', e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Select label="Icon" value={draft.icon} onChange={(e) => set('icon', e.target.value)}>
            {ICON_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Input
            label="Sort order"
            type="number"
            step="1"
            value={draft.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
          />
          <Input
            label="Price note"
            value={draft.price_note}
            onChange={(e) => set('price_note', e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6 rounded-lg bg-paper px-4 py-3.5">
          <label className="flex items-center gap-3">
            <Switch
              checked={draft.supports_frequency}
              onChange={(v) => set('supports_frequency', v)}
              label="Supports regular-clean frequency pricing"
            />
            <span className={cn(fieldLabel, 'cursor-pointer')}>Supports frequency</span>
          </label>
          <label className="flex items-center gap-3">
            <Switch checked={draft.is_active} onChange={(v) => set('is_active', v)} label="Active" />
            <span className={cn(fieldLabel, 'cursor-pointer')}>Active (shown on the site)</span>
          </label>
        </div>
      </div>
    </Modal>
  )
}

export default ServiceModal
