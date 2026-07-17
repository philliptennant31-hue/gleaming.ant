import type { ReactNode } from 'react'
import { SectionHeading } from '../ui/SectionHeading'
import { Container } from '../ui/Container'
import { Sparkle } from '../brand/Sparkle'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  children?: ReactNode
}

/** Consistent top band for interior pages: eyebrow + h1 + lead on a pane wash. */
export function PageHeader({ eyebrow, title, lead, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-pane/70 bg-gradient-to-b from-pane/45 to-paper">
      <Sparkle size={16} className="absolute right-[8%] top-10 text-teal/45" />
      <Sparkle size={11} className="absolute right-[16%] top-20 text-teal/30" />
      <Container className="py-14 sm:py-16">
        <div className="max-w-3xl">
          <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={lead} />
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  )
}

export default PageHeader
