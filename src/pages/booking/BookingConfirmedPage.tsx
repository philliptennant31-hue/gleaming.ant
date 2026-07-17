import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Check, Clock, Copy, MapPin } from 'lucide-react'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { formatDate, formatDuration, formatGBP, formatTime } from '../../lib/format'
import type { QuoteBreakdown } from '../../lib/pricing'
import type { BookingItem } from '../../lib/types'
import { Container } from '../../components/ui/Container'
import { Button } from '../../components/ui/Button'
import { Sparkle } from '../../components/brand/Sparkle'

interface ConfirmState {
  reference: string
  quote: QuoteBreakdown
  date: string
  time: string
  name: string
  items: BookingItem[]
}

function BreakdownRow({
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
      <span className={tone === 'muted' ? 'text-sm text-ink-soft' : 'text-sm text-ink'}>{label}</span>
      <span
        className={`font-mono tabular-nums ${strong ? 'text-xl font-semibold' : 'text-sm'} ${valueColor}`}
      >
        {value}
      </span>
    </div>
  )
}

export default function BookingConfirmedPage() {
  useDocumentTitle('Booking confirmed | Gleaming Ant')
  const { state } = useLocation()
  const [copied, setCopied] = useState(false)

  const data = state as ConfirmState | null
  // Direct hits / refreshes have no router state — send them back to the wizard.
  if (!data || !data.reference || !data.quote) {
    return <Navigate to="/booking" replace />
  }

  const { reference, quote, date, time, name } = data
  const firstName = name.trim().split(/\s+/)[0] || 'there'

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (e.g. permissions) — the reference is on screen anyway.
    }
  }

  return (
    <section className="py-14 sm:py-20">
      <Container size="narrow">
        {/* Celebratory header — restrained: a couple of sparkles, one clean tick */}
        <div className="relative text-center">
          <Sparkle size={18} className="twinkle absolute left-[18%] top-0 text-amber" />
          <Sparkle size={12} className="twinkle twinkle-2 absolute right-[22%] top-6 text-amber" />
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 text-teal-deep">
            <Check className="h-9 w-9" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            You're booked in, {firstName}!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink-soft">
            Thanks for choosing Gleaming Ant. We've got your request. Here's everything for your records.
          </p>
        </div>

        {/* Reference */}
        <div className="mt-8 flex flex-col items-center gap-3 rounded-card border border-pane bg-pane/30 px-6 py-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            Your booking reference
          </span>
          <span className="font-mono text-3xl font-bold tracking-[0.15em] text-ink">{reference}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyReference}
            leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copied ? 'Copied' : 'Copy reference'}
          </Button>
        </div>

        {/* Breakdown */}
        <div className="mt-6 rounded-card border border-pane bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Your booking</h2>

          <p className="mt-1 text-sm text-ink-soft">
            {date && time ? `${formatDate(date)} · ${formatTime(time)}` : 'Date to be confirmed'}
          </p>

          <ul className="mt-4 space-y-2">
            {quote.lines.map((line) => (
              <li key={line.service_id}>
                <BreakdownRow label={line.name} value={formatGBP(line.unit_price)} />
              </li>
            ))}
          </ul>

          <div className="my-3 border-t border-pane" />

          <div className="space-y-2">
            <BreakdownRow label="Subtotal" value={formatGBP(quote.subtotal)} tone="muted" />
            {quote.discountAmount > 0 && (
              <BreakdownRow
                label={`Bundle discount (${quote.discountPercent}%)`}
                value={`−${formatGBP(quote.discountAmount)}`}
                tone="teal"
              />
            )}
            {quote.surcharge > 0 && (
              <BreakdownRow
                label="Surrounding-area surcharge"
                value={`+${formatGBP(quote.surcharge)}`}
                tone="muted"
              />
            )}
          </div>

          <div className="my-3 border-t border-pane" />
          <BreakdownRow label="Total" value={formatGBP(quote.total)} strong />

          <dl className="mt-4 space-y-1.5 text-xs text-ink-soft">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <dt className="sr-only">Estimated time on site</dt>
              <dd>Around {formatDuration(quote.durationMinutes)} on site</dd>
            </div>
            {quote.areaName && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <dt className="sr-only">Area</dt>
                <dd>{quote.areaName}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* What happens next */}
        <div className="mt-6 rounded-card border border-teal/25 bg-teal/5 p-6">
          <h2 className="font-display text-lg font-bold text-ink">What happens next</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-ink">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-deep" aria-hidden="true" />
              We'll confirm your day and time by message. [PLACEHOLDER: confirmation channel — e.g. text /
              WhatsApp / email].
            </li>
            {quote.outsideArea && (
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-deep" aria-hidden="true" />
                Your postcode looks a little outside our usual patch, so we'll double-check we can reach you
                first.
              </li>
            )}
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-deep" aria-hidden="true" />
              There's nothing to pay now. [PLACEHOLDER: confirm how and when payment is taken].
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/">Back to home</Button>
          <Button to="/services" variant="secondary">
            Browse our services
          </Button>
        </div>
      </Container>
    </section>
  )
}
