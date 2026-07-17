import type { ReactNode } from 'react'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'
import { Button } from './Button'

type Tone = 'ink' | 'light'

function toneText(tone: Tone) {
  return tone === 'light' ? 'text-pane/85' : 'text-ink-soft'
}

export function LoadingState({
  message = 'Loading…',
  tone = 'ink',
  className,
}: {
  message?: string
  tone?: Tone
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-center', className)}>
      <Spinner size={26} className={tone === 'light' ? 'text-pane' : 'text-teal'} label={message} />
      <p className={cn('text-sm font-medium', toneText(tone))}>{message}</p>
    </div>
  )
}

export function ErrorState({
  onRetry,
  message = 'Something went wrong — try again or message us.',
  tone = 'ink',
  className,
}: {
  onRetry?: () => void
  message?: string
  tone?: Tone
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-14 text-center', className)}>
      <span
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center rounded-full',
          tone === 'light' ? 'bg-white/10 text-pane' : 'bg-danger-soft text-danger',
        )}
      >
        <TriangleAlert className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className={cn('max-w-sm text-base font-medium', tone === 'light' ? 'text-white' : 'text-ink')}>
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RotateCw className="h-4 w-4" />}>
            Try again
          </Button>
        )}
        <Button variant="ghost" size="sm" to="/contact">
          Message us
        </Button>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  tone = 'ink',
  className,
}: {
  icon?: ReactNode
  title: string
  body?: ReactNode
  action?: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed px-6 py-14 text-center',
        tone === 'light' ? 'border-white/20' : 'border-ink/15',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'inline-flex h-12 w-12 items-center justify-center rounded-full',
            tone === 'light' ? 'bg-white/10 text-pane' : 'bg-pane text-teal-deep',
          )}
        >
          {icon}
        </span>
      )}
      <p className={cn('text-lg font-semibold', tone === 'light' ? 'text-white' : 'text-ink')}>{title}</p>
      {body && <p className={cn('max-w-sm text-sm', toneText(tone))}>{body}</p>}
      {action}
    </div>
  )
}
