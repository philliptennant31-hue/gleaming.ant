import { useEffect, useMemo, useState } from 'react'
import { Inbox, Mail } from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { cn } from '../../lib/cn'
import { formatDate } from '../../lib/format'
import type { ContactMessage } from '../../lib/types'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states'
import {
  AdminHeading,
  MessageStatusBadge,
  SlideOver,
  TableCard,
  tdClass,
  thClass,
  useToast,
} from '../../components/admin/primitives'
import { fetchMessages, updateMessageStatus, type MessageStatus } from '../../components/admin/data'

const STATUSES: MessageStatus[] = ['new', 'read', 'replied', 'archived']
const STATUS_LABEL: Record<MessageStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${formatDate(d)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export default function MessagesPage() {
  const { data, loading, error, reload } = useAsync<ContactMessage[]>(fetchMessages, [])
  const toast = useToast()

  const [statusFilter, setStatusFilter] = useState<'all' | MessageStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(() => data?.find((m) => m.id === selectedId) ?? null, [data, selectedId])

  const filtered = useMemo(
    () => (data ?? []).filter((m) => statusFilter === 'all' || m.status === statusFilter),
    [data, statusFilter],
  )

  // Opening a new message marks it read.
  useEffect(() => {
    if (selected && selected.status === 'new') {
      updateMessageStatus(selected.id, 'read')
        .then(() => reload())
        .catch(() => undefined)
    }
    // Only when the opened id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function setStatus(id: string, status: MessageStatus) {
    try {
      await updateMessageStatus(id, status)
      toast.show(`Marked ${status}.`)
      reload()
    } catch {
      toast.show('Could not update the message.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeading title="Messages" description="Enquiries sent through the contact form." />

      <div className="flex items-end gap-3">
        <div className="w-48">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | MessageStatus)}
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <p className="pb-2.5 text-sm text-ink-soft">
          {filtered.length} {filtered.length === 1 ? 'message' : 'messages'}
        </p>
      </div>

      {loading && <LoadingState message="Loading messages…" />}
      {error && <ErrorState onRetry={reload} />}

      {!loading && !error && data && (
        filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No messages"
            body="Enquiries from the contact form will land here, newest first."
          />
        ) : (
          <TableCard minWidth={720}>
            <thead>
              <tr className="border-b border-pane bg-pane/30">
                <th className={thClass}>From</th>
                <th className={thClass}>Message</th>
                <th className={thClass}>Received</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className={cn(
                    'cursor-pointer border-b border-pane/60 last:border-0 hover:bg-pane/15',
                    m.status === 'new' && 'font-medium',
                  )}
                  onClick={() => setSelectedId(m.id)}
                >
                  <td className={tdClass}>
                    <span className="block text-ink">{m.name}</span>
                    <span className="block truncate text-xs text-ink-soft">{m.email}</span>
                  </td>
                  <td className={`${tdClass} max-w-[22rem]`}>
                    <span className="block truncate text-ink-soft">{m.message}</span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-ink-soft`}>{formatDateTime(m.created_at)}</td>
                  <td className={tdClass}>
                    <MessageStatusBadge status={m.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )
      )}

      <SlideOver
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? selected.name : 'Message'}
        description={selected ? formatDateTime(selected.created_at) : undefined}
        footer={
          selected ? (
            <Button
              href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: your Gleaming Ant enquiry')}`}
              size="sm"
              leftIcon={<Mail className="h-4 w-4" />}
              onClick={() => void setStatus(selected.id, 'replied')}
            >
              Reply by email
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center justify-between">
              <MessageStatusBadge status={selected.status} />
            </div>

            <section className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Email</span>
                <a className="text-teal-deep hover:text-ink" href={`mailto:${selected.email}`}>
                  {selected.email}
                </a>
              </div>
              {selected.phone && (
                <div className="flex justify-between gap-4">
                  <span className="text-ink-soft">Phone</span>
                  <a className="text-teal-deep hover:text-ink" href={`tel:${selected.phone.replace(/\s/g, '')}`}>
                    {selected.phone}
                  </a>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Message</h3>
              <p className="whitespace-pre-wrap rounded-lg border border-pane bg-paper px-4 py-3 leading-relaxed text-ink">
                {selected.message}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void setStatus(selected.id, s)}
                    aria-pressed={selected.status === s}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                      selected.status === s
                        ? 'bg-teal-deep text-white'
                        : 'bg-pane/60 text-teal-deep hover:bg-pane',
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
