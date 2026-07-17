// Shared, admin-only UI primitives: toast, modal, slide-over, confirm dialog,
// switch, status badges and page heading. Utilitarian and table-first, but built
// on the brand tokens and reusing the Phase 1 UI kit where it fits.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Badge } from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import type { BookingStatus } from '../../lib/types'
import type { MessageStatus } from './data'

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
type ToastTone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}
interface ToastApi {
  show: (message: string, tone?: ToastTone) => void
}
const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++counter.current
    setToasts((list) => [...list, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
          role="status"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-card border px-4 py-3 text-sm font-medium shadow-lift',
                toast.tone === 'error'
                  ? 'border-danger/30 bg-danger-soft text-danger'
                  : toast.tone === 'info'
                    ? 'border-pane bg-white text-ink'
                    : 'border-teal/30 bg-white text-teal-deep',
              )}
            >
              {toast.tone === 'error' ? (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) return { show: () => undefined }
  return ctx
}

// ---------------------------------------------------------------------------
// Dialog behaviour (Esc to close + body scroll lock + initial focus)
// ---------------------------------------------------------------------------
function useDialogBehaviour(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => ref.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
    }
  }, [open, onClose, ref])
}

// ---------------------------------------------------------------------------
// Modal (centred dialog for create/edit forms)
// ---------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useDialogBehaviour(open, onClose, panelRef)
  if (!open) return null

  const width = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[1px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative my-4 w-full rounded-card border border-pane bg-white shadow-lift outline-none',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-pane px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-bold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-pane/60 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-pane bg-paper/60 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// SlideOver (right-side drawer, used for booking detail)
// ---------------------------------------------------------------------------
export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useDialogBehaviour(open, onClose, panelRef)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-[1px]" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-lift outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-pane px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-bold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-pane/60 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center gap-3 border-t border-pane bg-paper/60 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// ConfirmDialog (destructive actions)
// ---------------------------------------------------------------------------
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          {/* Raw button so the danger colour never collides with a Button variant's own colour utilities. */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-btn px-3.5 py-2 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55',
              destructive ? 'bg-danger text-white hover:bg-danger/90' : 'bg-amber text-ink hover:bg-amber-deep',
            )}
          >
            {busy && <Spinner size={16} className="text-current" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{message}</p>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// DangerButton — a ghost-style destructive action (raw button so its colour
// utilities never conflict with the shared Button's variant colours).
// ---------------------------------------------------------------------------
export function DangerButton({
  children,
  onClick,
  disabled,
  title,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors disabled:pointer-events-none',
        size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-[0.95rem]',
        disabled ? 'text-ink-soft/55' : 'text-danger hover:bg-danger-soft',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Switch (active toggles)
// ---------------------------------------------------------------------------
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-teal-deep' : 'bg-ink/20',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Status badges
// ---------------------------------------------------------------------------
const BOOKING_TONE: Record<BookingStatus, BadgeTone> = {
  pending: 'amber',
  confirmed: 'teal',
  completed: 'ink',
  cancelled: 'danger',
}
const BOOKING_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
export function BookingStatusBadge({ status, size }: { status: BookingStatus; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={BOOKING_TONE[status]} size={size}>
      {BOOKING_LABEL[status]}
    </Badge>
  )
}

const MESSAGE_TONE: Record<MessageStatus, BadgeTone> = {
  new: 'amber',
  read: 'teal',
  replied: 'ink',
  archived: 'neutral',
}
const MESSAGE_LABEL: Record<MessageStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
}
export function MessageStatusBadge({ status, size }: { status: MessageStatus; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={MESSAGE_TONE[status]} size={size}>
      {MESSAGE_LABEL[status]}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Page heading (title + description + actions)
// ---------------------------------------------------------------------------
export function AdminHeading({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table shell (consistent card-wrapped, horizontally-scrollable table)
// ---------------------------------------------------------------------------
export function TableCard({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-card border border-pane bg-white shadow-card">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export const thClass = 'px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-soft'
export const tdClass = 'px-4 py-3 align-middle text-ink'
