import type { ReactNode } from 'react'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Sparkle } from '../brand/Sparkle'
import { SparkleBurstIcon } from '../brand/icons-brand'

interface ComingSoonProps {
  eyebrow?: string
  title: string
  body: ReactNode
  phase?: string
  actions?: ReactNode
  icon?: ReactNode
}

/** Branded "coming soon" card used by the Phase 2/3 route stubs. */
export function ComingSoon({
  eyebrow = 'Coming soon',
  title,
  body,
  phase,
  actions,
  icon,
}: ComingSoonProps) {
  return (
    <section className="flex min-h-[60vh] items-center py-16">
      <Container>
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-5 overflow-hidden rounded-card border border-pane bg-white p-8 text-center shadow-card sm:p-12">
          <Sparkle size={16} className="absolute right-6 top-6 text-teal/40" />
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-pane text-teal-deep">
            {icon ?? <SparkleBurstIcon className="h-7 w-7" />}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">{eyebrow}</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="text-ink-soft">{body}</p>
          {phase && (
            <p className="rounded-full bg-pane/60 px-3 py-1 text-xs font-semibold text-teal-deep">{phase}</p>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {actions ?? <Button to="/">Back home</Button>}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default ComingSoon
