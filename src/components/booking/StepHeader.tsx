import type { ReactNode } from 'react'

/** Consistent heading for each wizard step: an h2 with a short lead. */
export function StepHeader({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold text-ink sm:text-[1.6rem]">{title}</h2>
      {lead && <p className="mt-2 text-ink-soft">{lead}</p>}
    </div>
  )
}

export default StepHeader
