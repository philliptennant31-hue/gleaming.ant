import { useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { cn } from '../../lib/cn'
import { formatGBP } from '../../lib/format'
import type { ServiceArea } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { fieldLabel } from '../../components/ui/field'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states'
import {
  AdminHeading,
  ConfirmDialog,
  DangerButton,
  Modal,
  Switch,
  TableCard,
  tdClass,
  thClass,
  useToast,
} from '../../components/admin/primitives'
import {
  createArea,
  deleteArea,
  fetchAreasAdmin,
  updateArea,
  type AreaDraft,
} from '../../components/admin/data'

function parsePrefixes(input: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of input.split(',')) {
    const clean = part.trim().toUpperCase()
    if (clean && !seen.has(clean)) {
      seen.add(clean)
      out.push(clean)
    }
  }
  return out
}

export default function AreasPage() {
  const { data, loading, error, reload } = useAsync<ServiceArea[]>(fetchAreasAdmin, [])
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceArea | null>(null)
  const [toDelete, setToDelete] = useState<ServiceArea | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(area: ServiceArea) {
    setEditing(area)
    setModalOpen(true)
  }

  async function toggleActive(area: ServiceArea) {
    try {
      await updateArea(area.id, { is_active: !area.is_active })
      toast.show(area.is_active ? 'Area hidden from the site.' : 'Area is now live.')
      reload()
    } catch {
      toast.show('Could not update the area.', 'error')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteArea(toDelete.id)
      toast.show('Area removed.')
      reload()
    } catch {
      toast.show('Could not remove the area.', 'error')
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeading
        title="Areas"
        description="The postcodes you cover, plus any surcharges for outer areas."
        actions={
          <Button size="sm" onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
            New area
          </Button>
        }
      />

      {loading && <LoadingState message="Loading areas…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        data.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="No areas yet"
            body="Add the postcodes you cover so the booking tool can check them."
            action={
              <Button size="sm" onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
                New area
              </Button>
            }
          />
        ) : (
          <TableCard minWidth={760}>
            <thead>
              <tr className="border-b border-pane bg-pane/30">
                <th className={thClass}>Area</th>
                <th className={thClass}>Postcode prefixes</th>
                <th className={`${thClass} text-right`}>Surcharge</th>
                <th className={thClass}>Core</th>
                <th className={thClass}>Active</th>
                <th className={`${thClass} text-right`}>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {data.map((area) => (
                <tr key={area.id} className="border-b border-pane/60 last:border-0 hover:bg-pane/15">
                  <td className={`${tdClass} font-semibold`}>{area.name}</td>
                  <td className={tdClass}>
                    <span className="flex flex-wrap gap-1">
                      {area.postcode_prefixes.length === 0 ? (
                        <span className="text-ink-soft">-</span>
                      ) : (
                        area.postcode_prefixes.map((p) => (
                          <span key={p} className="rounded bg-pane px-1.5 py-0.5 font-mono text-xs text-teal-deep">
                            {p}
                          </span>
                        ))
                      )}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right font-mono`}>
                    {area.surcharge > 0 ? formatGBP(area.surcharge) : '-'}
                  </td>
                  <td className={tdClass}>
                    {area.is_core ? <Badge tone="teal" size="sm">Core</Badge> : <Badge tone="neutral" size="sm">Outer</Badge>}
                  </td>
                  <td className={tdClass}>
                    <Switch checked={area.is_active} onChange={() => void toggleActive(area)} label={`Toggle ${area.name}`} />
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(area)} leftIcon={<Pencil className="h-4 w-4" />}>
                        Edit
                      </Button>
                      <DangerButton onClick={() => setToDelete(area)} aria-label={`Delete ${area.name}`}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </DangerButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )
      )}

      <AreaModal open={modalOpen} area={editing} onClose={() => setModalOpen(false)} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove this area?"
        message={
          <>
            Removing <span className="font-semibold text-ink">{toDelete?.name}</span> means the booking tool will no
            longer recognise its postcodes. This can’t be undone.
          </>
        }
        confirmLabel="Remove area"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Area create / edit modal
// ---------------------------------------------------------------------------
interface AreaFormDraft {
  name: string
  prefixes: string
  surcharge: string
  is_core: boolean
  is_active: boolean
  sort_order: string
}

function toDraft(area: ServiceArea | null): AreaFormDraft {
  return {
    name: area?.name ?? '',
    prefixes: area ? area.postcode_prefixes.join(', ') : '',
    surcharge: area ? String(area.surcharge) : '0',
    is_core: area?.is_core ?? true,
    is_active: area?.is_active ?? true,
    sort_order: area ? String(area.sort_order) : '0',
  }
}

function AreaModal({
  open,
  area,
  onClose,
  onSaved,
}: {
  open: boolean
  area: ServiceArea | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState<AreaFormDraft>(() => toDraft(area))
  const [err, setErr] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(toDraft(area))
      setErr(undefined)
    }
  }, [open, area])

  function set<K extends keyof AreaFormDraft>(key: K, value: AreaFormDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    const name = draft.name.trim()
    if (!name) {
      setErr('Give the area a name.')
      return
    }
    const payload: AreaDraft = {
      name,
      postcode_prefixes: parsePrefixes(draft.prefixes),
      surcharge: Number(draft.surcharge) || 0,
      is_core: draft.is_core,
      is_active: draft.is_active,
      sort_order: Math.round(Number(draft.sort_order) || 0),
    }
    setSaving(true)
    setErr(undefined)
    try {
      if (area) {
        await updateArea(area.id, payload)
        toast.show('Area updated.')
      } else {
        await createArea(payload)
        toast.show('Area created.')
      }
      onSaved()
      onClose()
    } catch {
      setErr('Could not save the area. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={area ? 'Edit area' : 'New area'}
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
            {saving ? 'Saving…' : area ? 'Save changes' : 'Create area'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {err && (
          <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger" role="alert">
            {err}
          </p>
        )}
        <Input label="Area name" required value={draft.name} onChange={(e) => set('name', e.target.value)} />
        <Input
          label="Postcode prefixes"
          hint="Comma-separated, e.g. SS13, SS14, SS15"
          value={draft.prefixes}
          onChange={(e) => set('prefixes', e.target.value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Surcharge (£)"
            type="number"
            min="0"
            step="0.01"
            value={draft.surcharge}
            onChange={(e) => set('surcharge', e.target.value)}
          />
          <Input
            label="Sort order"
            type="number"
            step="1"
            value={draft.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-6 rounded-lg bg-paper px-4 py-3.5">
          <label className="flex items-center gap-3">
            <Switch checked={draft.is_core} onChange={(v) => set('is_core', v)} label="Core area" />
            <span className={cn(fieldLabel, 'cursor-pointer')}>Core area (no surcharge)</span>
          </label>
          <label className="flex items-center gap-3">
            <Switch checked={draft.is_active} onChange={(v) => set('is_active', v)} label="Active" />
            <span className={cn(fieldLabel, 'cursor-pointer')}>Active</span>
          </label>
        </div>
      </div>
    </Modal>
  )
}
