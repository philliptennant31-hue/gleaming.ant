import { useEffect, useMemo, useState } from 'react'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { cn } from '../../lib/cn'
import { formatGBP } from '../../lib/format'
import type { BundleDiscount, Frequency, PropertyBand, Service, ServicePrice } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { fieldBase, fieldNormal } from '../../components/ui/field'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states'
import { ServiceIcon } from '../../components/brand/ServiceIcon'
import {
  AdminHeading,
  ConfirmDialog,
  DangerButton,
  Switch,
  TableCard,
  tdClass,
  thClass,
  useToast,
} from '../../components/admin/primitives'
import { ServiceModal } from '../../components/admin/ServiceModal'
import {
  createBundleDiscount,
  deleteBundleDiscount,
  fetchAllServicePrices,
  fetchBundleDiscountsAdmin,
  fetchFrequenciesAdmin,
  fetchPropertyBandsAdmin,
  fetchServicesAdmin,
  updateBundleDiscount,
  updateFrequency,
  updateService,
  upsertServicePrices,
  type ServicePriceRow,
} from '../../components/admin/data'

interface ServicesData {
  services: Service[]
  bands: PropertyBand[]
  prices: ServicePrice[]
  frequencies: Frequency[]
  bundles: BundleDiscount[]
}

function cellInput(extra?: string) {
  return cn(fieldBase, fieldNormal, 'px-2.5 py-1.5 text-right font-mono text-sm', extra)
}

export default function ServicesPage() {
  const { data, loading, error, reload } = useAsync<ServicesData>(async () => {
    const [services, bands, prices, frequencies, bundles] = await Promise.all([
      fetchServicesAdmin(),
      fetchPropertyBandsAdmin(),
      fetchAllServicePrices(),
      fetchFrequenciesAdmin(),
      fetchBundleDiscountsAdmin(),
    ])
    return { services, bands, prices, frequencies, bundles }
  }, [])

  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(service: Service) {
    setEditing(service)
    setModalOpen(true)
  }

  async function toggleActive(service: Service) {
    try {
      await updateService(service.id, { is_active: !service.is_active })
      toast.show(service.is_active ? 'Service hidden from the site.' : 'Service is now live.')
      reload()
    } catch {
      toast.show('Could not update the service.', 'error')
    }
  }

  return (
    <div className="space-y-10">
      <AdminHeading
        title="Services & pricing"
        description="Manage your services, the price matrix, regular-clean frequencies and bundle discounts."
        actions={
          <Button size="sm" onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
            New service
          </Button>
        }
      />

      {loading && <LoadingState message="Loading services…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        <>
          {/* Services table */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-ink">Services</h2>
            {data.services.length === 0 ? (
              <EmptyState
                title="No services yet"
                body="Add your first service to start taking bookings."
                action={
                  <Button size="sm" onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
                    New service
                  </Button>
                }
              />
            ) : (
              <TableCard minWidth={680}>
                <thead>
                  <tr className="border-b border-pane bg-pane/30">
                    <th className={thClass}>Service</th>
                    <th className={`${thClass} text-right`}>From</th>
                    <th className={`${thClass} text-right`}>Sort</th>
                    <th className={thClass}>Active</th>
                    <th className={`${thClass} text-right`}>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {data.services.map((s) => (
                    <tr key={s.id} className="border-b border-pane/60 last:border-0 hover:bg-pane/15">
                      <td className={tdClass}>
                        <span className="flex items-center gap-2.5">
                          <ServiceIcon name={s.icon} className="h-4 w-4 text-teal-deep" />
                          <span>
                            <span className="block font-semibold text-ink">{s.name}</span>
                            <span className="font-mono text-xs text-ink-soft">{s.slug}</span>
                          </span>
                        </span>
                      </td>
                      <td className={`${tdClass} text-right font-mono`}>{formatGBP(s.base_price)}</td>
                      <td className={`${tdClass} text-right font-mono text-ink-soft`}>{s.sort_order}</td>
                      <td className={tdClass}>
                        <Switch
                          checked={s.is_active}
                          onChange={() => void toggleActive(s)}
                          label={`Toggle ${s.name} active`}
                        />
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)} leftIcon={<Pencil className="h-4 w-4" />}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>
            )}
          </section>

          {/* Price matrix */}
          <PriceMatrixEditor services={data.services} bands={data.bands} prices={data.prices} onSaved={reload} />

          {/* Frequencies */}
          <FrequenciesEditor frequencies={data.frequencies} onSaved={reload} />

          {/* Bundles */}
          <BundlesEditor bundles={data.bundles} onSaved={reload} />
        </>
      )}

      <ServiceModal
        open={modalOpen}
        service={editing}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Price matrix editor
// ---------------------------------------------------------------------------
function keyOf(serviceId: string, band: string) {
  return `${serviceId}|${band}`
}

function PriceMatrixEditor({
  services,
  bands,
  prices,
  onSaved,
}: {
  services: Service[]
  bands: PropertyBand[]
  prices: ServicePrice[]
  onSaved: () => void
}) {
  const toast = useToast()
  const initial = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of prices) map[keyOf(p.service_id, p.band_code)] = String(p.price)
    return map
  }, [prices])
  const [draft, setDraft] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(initial), [initial])

  function changedRows(): ServicePriceRow[] {
    const rows: ServicePriceRow[] = []
    for (const s of services) {
      for (const b of bands) {
        const k = keyOf(s.id, b.code)
        const raw = (draft[k] ?? '').trim()
        if (raw === '') continue
        const num = Number(raw)
        if (!Number.isFinite(num)) continue
        const before = initial[k]
        if (before === undefined || Math.round(Number(before) * 100) !== Math.round(num * 100)) {
          rows.push({ service_id: s.id, band_code: b.code, price: num })
        }
      }
    }
    return rows
  }

  async function save() {
    const rows = changedRows()
    if (rows.length === 0) {
      toast.show('No price changes to save.', 'info')
      return
    }
    setSaving(true)
    try {
      await upsertServicePrices(rows)
      toast.show(`Saved ${rows.length} price${rows.length === 1 ? '' : 's'}.`)
      onSaved()
    } catch {
      toast.show('Could not save prices. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (services.length === 0 || bands.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Price matrix</h2>
          <p className="text-sm text-ink-soft">Price per service and property band. Blank cells fall back to the “from” price.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void save()}
          disabled={saving}
          leftIcon={saving ? <Spinner size={16} className="text-teal-deep" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save prices'}
        </Button>
      </div>
      <TableCard minWidth={120 + bands.length * 120}>
        <thead>
          <tr className="border-b border-pane bg-pane/30">
            <th className={`${thClass} sticky left-0 z-10 bg-pane/30`}>Service</th>
            {bands.map((b) => (
              <th key={b.code} className={`${thClass} text-right`}>
                {b.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-b border-pane/60 last:border-0">
              <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-2.5 text-left font-semibold text-ink">
                {s.name}
              </th>
              {bands.map((b) => {
                const k = keyOf(s.id, b.code)
                return (
                  <td key={b.code} className="px-3 py-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      aria-label={`${s.name} — ${b.label} price`}
                      className={cellInput('w-24')}
                      value={draft[k] ?? ''}
                      placeholder={String(s.base_price)}
                      onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </TableCard>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Frequencies editor
// ---------------------------------------------------------------------------
interface FreqDraft {
  code: string
  label: string
  multiplier: string
  is_active: boolean
}

function FrequenciesEditor({ frequencies, onSaved }: { frequencies: Frequency[]; onSaved: () => void }) {
  const toast = useToast()
  const initial = useMemo<FreqDraft[]>(
    () => frequencies.map((f) => ({ code: f.code, label: f.label, multiplier: String(f.multiplier), is_active: f.is_active })),
    [frequencies],
  )
  const [draft, setDraft] = useState<FreqDraft[]>(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(initial), [initial])

  function update(code: string, patch: Partial<FreqDraft>) {
    setDraft((rows) => rows.map((r) => (r.code === code ? { ...r, ...patch } : r)))
  }

  async function save() {
    const changed = draft.filter((row) => {
      const before = initial.find((i) => i.code === row.code)
      if (!before) return false
      return (
        before.label !== row.label ||
        before.multiplier !== row.multiplier ||
        before.is_active !== row.is_active
      )
    })
    if (changed.length === 0) {
      toast.show('No frequency changes to save.', 'info')
      return
    }
    setSaving(true)
    try {
      for (const row of changed) {
        await updateFrequency(row.code, {
          label: row.label.trim(),
          multiplier: Number(row.multiplier) || 0,
          is_active: row.is_active,
        })
      }
      toast.show('Frequencies updated.')
      onSaved()
    } catch {
      toast.show('Could not save frequencies. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (frequencies.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Frequencies</h2>
          <p className="text-sm text-ink-soft">Regular-clean options and their price multipliers.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void save()}
          disabled={saving}
          leftIcon={saving ? <Spinner size={16} className="text-teal-deep" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save frequencies'}
        </Button>
      </div>
      <TableCard minWidth={560}>
        <thead>
          <tr className="border-b border-pane bg-pane/30">
            <th className={thClass}>Code</th>
            <th className={thClass}>Label</th>
            <th className={`${thClass} text-right`}>Multiplier</th>
            <th className={thClass}>Active</th>
          </tr>
        </thead>
        <tbody>
          {draft.map((f) => (
            <tr key={f.code} className="border-b border-pane/60 last:border-0">
              <td className={`${tdClass} font-mono text-xs text-ink-soft`}>{f.code}</td>
              <td className="px-4 py-2">
                <input
                  aria-label={`${f.code} label`}
                  className={cn(fieldBase, fieldNormal, 'px-2.5 py-1.5 text-sm')}
                  value={f.label}
                  onChange={(e) => update(f.code, { label: e.target.value })}
                />
              </td>
              <td className="px-4 py-2 text-right">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  aria-label={`${f.code} multiplier`}
                  className={cellInput('w-24')}
                  value={f.multiplier}
                  onChange={(e) => update(f.code, { multiplier: e.target.value })}
                />
              </td>
              <td className={tdClass}>
                <Switch checked={f.is_active} onChange={(v) => update(f.code, { is_active: v })} label={`${f.code} active`} />
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Bundle discounts editor
// ---------------------------------------------------------------------------
interface BundleDraft {
  id: string
  min_services: string
  discount_percent: string
  is_active: boolean
}

function BundlesEditor({ bundles, onSaved }: { bundles: BundleDiscount[]; onSaved: () => void }) {
  const toast = useToast()
  const initial = useMemo<BundleDraft[]>(
    () =>
      bundles.map((b) => ({
        id: b.id,
        min_services: String(b.min_services),
        discount_percent: String(b.discount_percent),
        is_active: b.is_active,
      })),
    [bundles],
  )
  const [draft, setDraft] = useState<BundleDraft[]>(initial)
  const [saving, setSaving] = useState(false)
  const [newMin, setNewMin] = useState('')
  const [newPct, setNewPct] = useState('')
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<BundleDraft | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => setDraft(initial), [initial])

  function update(id: string, patch: Partial<BundleDraft>) {
    setDraft((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function saveChanges() {
    const changed = draft.filter((row) => {
      const before = initial.find((i) => i.id === row.id)
      if (!before) return false
      return (
        before.min_services !== row.min_services ||
        before.discount_percent !== row.discount_percent ||
        before.is_active !== row.is_active
      )
    })
    if (changed.length === 0) {
      toast.show('No bundle changes to save.', 'info')
      return
    }
    setSaving(true)
    try {
      for (const row of changed) {
        await updateBundleDiscount(row.id, {
          min_services: Math.max(1, Math.round(Number(row.min_services) || 0)),
          discount_percent: Number(row.discount_percent) || 0,
          is_active: row.is_active,
        })
      }
      toast.show('Bundle discounts updated.')
      onSaved()
    } catch {
      toast.show('Could not save bundles. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function add() {
    const min = Math.round(Number(newMin) || 0)
    const pct = Number(newPct) || 0
    if (min < 1 || pct <= 0) {
      toast.show('Enter a minimum services count and a discount percent.', 'error')
      return
    }
    setAdding(true)
    try {
      await createBundleDiscount({ min_services: min, discount_percent: pct, is_active: true })
      toast.show('Bundle discount added.')
      setNewMin('')
      setNewPct('')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      toast.show(/duplicate|unique/i.test(message) ? 'A bundle for that count already exists.' : 'Could not add the bundle.', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteBundleDiscount(toDelete.id)
      toast.show('Bundle discount removed.')
      onSaved()
    } catch {
      toast.show('Could not remove the bundle.', 'error')
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Bundle discounts</h2>
          <p className="text-sm text-ink-soft">Discounts applied when a customer books multiple services in one visit.</p>
        </div>
        {draft.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void saveChanges()}
            disabled={saving}
            leftIcon={saving ? <Spinner size={16} className="text-teal-deep" /> : undefined}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </div>

      {draft.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="No bundle discounts"
          body="Add one below to reward multi-service bookings."
        />
      ) : (
        <TableCard minWidth={560}>
          <thead>
            <tr className="border-b border-pane bg-pane/30">
              <th className={`${thClass} text-right`}>Min services</th>
              <th className={`${thClass} text-right`}>Discount %</th>
              <th className={thClass}>Active</th>
              <th className={`${thClass} text-right`}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((b) => (
              <tr key={b.id} className="border-b border-pane/60 last:border-0">
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    aria-label="Minimum services"
                    className={cellInput('w-20')}
                    value={b.min_services}
                    onChange={(e) => update(b.id, { min_services: e.target.value })}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    aria-label="Discount percent"
                    className={cellInput('w-20')}
                    value={b.discount_percent}
                    onChange={(e) => update(b.id, { discount_percent: e.target.value })}
                  />
                </td>
                <td className={tdClass}>
                  <Switch checked={b.is_active} onChange={(v) => update(b.id, { is_active: v })} label="Bundle active" />
                </td>
                <td className={`${tdClass} text-right`}>
                  <DangerButton onClick={() => setToDelete(b)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </DangerButton>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {/* Add row */}
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-dashed border-ink/15 p-4">
        <Input
          label="Min services"
          type="number"
          min="1"
          step="1"
          className="w-32"
          value={newMin}
          onChange={(e) => setNewMin(e.target.value)}
        />
        <Input
          label="Discount %"
          type="number"
          min="0"
          step="0.5"
          className="w-32"
          value={newPct}
          onChange={(e) => setNewPct(e.target.value)}
        />
        <Button
          size="sm"
          onClick={() => void add()}
          disabled={adding}
          leftIcon={adding ? <Spinner size={16} className="text-ink" /> : <Plus className="h-4 w-4" />}
        >
          {adding ? 'Adding…' : 'Add bundle'}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove this bundle discount?"
        message="Customers will no longer get this multi-service discount."
        confirmLabel="Remove"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  )
}
