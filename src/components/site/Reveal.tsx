import { createElement, type ElementType, type ReactNode } from 'react'
import { useReveal } from '../../lib/useReveal'
import { cn } from '../../lib/cn'

interface RevealProps {
  children: ReactNode
  /** Element to render (default div). Use the real element so grids/lists keep their semantics. */
  as?: ElementType
  className?: string
  /** Stagger direct children in (for grids/lists) instead of revealing the block as one. */
  stagger?: boolean
  threshold?: number
  rootMargin?: string
  /** Re-arm when this changes (e.g. after async content mounts). */
  when?: unknown
  id?: string
  'aria-labelledby'?: string
  'aria-label'?: string
}

/**
 * Drop-in scroll-reveal wrapper. Renders `as` (default div) with the reveal
 * class and wires the fire-once IntersectionObserver. Fully progressive: with
 * no JS or under reduced motion the content is visible immediately (see
 * useReveal / index.css). Put `stagger` on grids and lists so the class lands
 * on the flex/grid element and its direct children cascade in.
 */
export function Reveal({
  children,
  as = 'div',
  className,
  stagger = false,
  threshold,
  rootMargin,
  when,
  ...rest
}: RevealProps) {
  const ref = useReveal<HTMLElement>({ threshold, rootMargin, when })
  return createElement(
    as,
    { ref, className: cn(stagger ? 'reveal-stagger' : 'reveal', className), ...rest },
    children,
  )
}

export default Reveal
