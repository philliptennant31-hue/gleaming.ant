import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  tone?: 'ink' | 'light'
  as?: 'h1' | 'h2' | 'h3'
  id?: string
  className?: string
}

/**
 * Eyebrow + heading + description. The eyebrow's short rule is a structural
 * cue (a wiped edge), not decoration — it marks the start of a section.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'ink',
  as: Tag = 'h2',
  id,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center'
  const eyebrowColor = tone === 'light' ? 'text-pane' : 'text-teal-deep'
  const titleColor = tone === 'light' ? 'text-white' : 'text-ink'
  const descColor = tone === 'light' ? 'text-pane/85' : 'text-ink-soft'

  return (
    <div className={cn(centered ? 'text-center' : 'text-left', className)}>
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]',
            eyebrowColor,
          )}
        >
          <span className="h-px w-6 bg-current opacity-45" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <Tag
        id={id}
        className={cn(
          'font-display font-extrabold tracking-tight',
          eyebrow ? 'mt-3' : '',
          Tag === 'h1' ? 'text-4xl sm:text-5xl' : 'text-[1.9rem] sm:text-4xl',
          titleColor,
        )}
      >
        {title}
      </Tag>
      {description && (
        <p className={cn('mt-4 text-lg leading-relaxed', centered && 'mx-auto max-w-2xl', descColor)}>
          {description}
        </p>
      )}
    </div>
  )
}

export default SectionHeading
