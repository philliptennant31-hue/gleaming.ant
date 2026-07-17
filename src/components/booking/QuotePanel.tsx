import { useEffect, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { ClockIcon, MapPinIcon, SparkleBurstIcon } from '../brand/icons-brand'
import { cn } from '../../lib/cn'
import { formatDuration, formatGBP } from '../../lib/format'
import type { QuoteBreakdown } from '../../lib/pricing'
import { Sparkle } from '../brand/Sparkle'

export interface QuoteView {
  quote: QuoteBreakdown | null
  /** Chosen property band label, or null before a band is picked. */
  bandLabel: string | null
  /** Chosen frequency label — only meaningful when `showFrequency` is true. */
  frequencyLabel: string | null
  /** Whether any selected service supports frequency (so it's worth showing). */
  showFrequency: boolean
  postcode: string
}

function Row({
  label,
  value,
  tone = 'ink',
  strong,
}: {
  label: React.ReactNode
  value: React.ReactNode
  tone?: 'ink' | 'muted' | 'teal'
  strong?: boolean
}) {
  const valueColor = tone === 'teal' ? 'text-teal-deep' : tone === 'muted' ? 'text-ink-soft' : 'text-ink'
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cn('text-sm', tone === 'muted' ? 'text-ink-soft' : 'text-ink')}>{label}</span>
      <span className={cn('font-mono tabular-nums', strong ? 'text-lg font-semibold' : 'text-sm', valueColor)}>
        {value}
      </span>
    </div>
  )
}

/** The itemised quote body. Reused in the sidebar, the mobile sheet and step 5. */
export function QuoteContent({ quote, bandLabel, frequencyLabel, showFrequency, postcode }: QuoteView) {
  const hasLines = quote !== null && quote.lines.length > 0

  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkle size={16} className="text-amber" />
        <h2 className="font-display text-lg font-bold text-ink">Your quote</h2>
      </div>

      {!hasLines ? (
        <p className="mt-3 text-sm text-ink-soft">
          Pick your services and we'll work out the price here, live.
        </p>
      ) : (
        <>
          {/* Context chips: property size + frequency */}
          {(bandLabel || (showFrequency && frequencyLabel)) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {bandLabel && (
                <span className="rounded-full bg-pane px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
                  {bandLabel}
                </span>
              )}
              {showFrequency && frequencyLabel && (
                <span className="rounded-full bg-pane px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
                  {frequencyLabel}
                </span>
              )}
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {quote.lines.map((line) => (
              <li key={line.service_id}>
                <Row label={line.name} value={formatGBP(line.unit_price)} />
              </li>
            ))}
          </ul>

          <div className="my-3 border-t border-pane" />

          <div className="space-y-2">
            <Row label="Subtotal" value={formatGBP(quote.subtotal)} tone="muted" />
            {quote.discountAmount > 0 && (
              <Row
                label={`Bundle discount (${quote.discountPercent}%)`}
                value={`−${formatGBP(quote.discountAmount)}`}
                tone="teal"
              />
            )}
            {quote.surcharge > 0 && (
              <Row label="Surrounding-area surcharge" value={`+${formatGBP(quote.surcharge)}`} tone="muted" />
            )}
          </div>

          <div className="my-3 border-t border-pane" />

          <Row label="Total" value={formatGBP(quote.total)} strong />

          <dl className="mt-4 space-y-1.5 text-xs text-ink-soft">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              <dt className="sr-only">Estimated time on site</dt>
              <dd>Around {formatDuration(quote.durationMinutes)} on site</dd>
            </div>
            {quote.areaName && (
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="h-3.5 w-3.5" />
                <dt className="sr-only">Area</dt>
                <dd>{quote.areaName}</dd>
              </div>
            )}
          </dl>

          {/* Provisional / outside-area notes */}
          {!bandLabel && (
            <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-pane/40 px-3 py-2 text-xs text-ink-soft">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Prices are a "from" guide. Choose your property size for the exact quote.
            </p>
          )}
          {quote.outsideArea && postcode.trim() !== '' && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-pane/40 px-3 py-2 text-xs text-ink-soft">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Looks like you're outside our usual patch. Send the booking through and we'll confirm by message.
            </p>
          )}
        </>
      )}
    </div>
  )
}

/**
 * The persistent live quote: a sticky sidebar card on desktop, and a collapsible
 * bar pinned to the bottom on mobile that expands into a sheet.
 */
export function QuotePanel(props: QuoteView) {
  const [expanded, setExpanded] = useState(false)
  const total = props.quote?.total ?? 0
  const hasLines = props.quote !== null && props.quote.lines.length > 0

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-card border border-pane bg-white p-6 shadow-card">
          <QuoteContent {...props} />
        </div>
      </aside>

      {/* Mobile collapsible bar */}
      <div className="lg:hidden">
        {expanded && (
          <button
            type="button"
            aria-label="Close quote summary"
            className="fixed inset-0 z-40 bg-ink/30"
            onClick={() => setExpanded(false)}
          />
        )}
        <div className="fixed inset-x-0 bottom-0 z-40">
          {expanded && (
            <div className="max-h-[60vh] overflow-y-auto border-t border-pane bg-white px-5 pb-4 pt-5 shadow-lift">
              <QuoteContent {...props} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex w-full items-center justify-between gap-3 border-t border-pane bg-white px-5 py-3 text-left shadow-[0_-8px_24px_-16px_rgba(34,65,79,0.4)]"
          >
            <span className="flex items-center gap-2">
              <SparkleBurstIcon className="h-4 w-4" />
              <span className="text-sm font-semibold text-ink">
                {hasLines ? 'Your quote' : 'Build your quote'}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {hasLines && <span className="font-mono text-lg font-semibold text-ink">{formatGBP(total)}</span>}
              <ChevronDown
                className={cn('h-5 w-5 text-ink-soft transition-transform', expanded && 'rotate-180')}
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </div>
    </>
  )
}

export default QuotePanel
