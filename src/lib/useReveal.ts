import { useEffect, useRef } from 'react'

/**
 * Fire-once scroll reveal (IntersectionObserver).
 *
 * Attach the returned ref to an element that already carries the `reveal` (or
 * `reveal-stagger`) class in its markup. When the element first scrolls into
 * view it gains `is-visible`, which the CSS uses to fade + rise it in.
 *
 * Progressive enhancement, three ways safe:
 *  - No JS: this never runs, `html.js` is never set, and the CSS leaves every
 *    `reveal` element fully visible.
 *  - Reduced motion: the CSS hidden state is gated behind
 *    `prefers-reduced-motion: no-preference`, and we also add `is-visible`
 *    immediately here — content shows at once, no animation.
 *  - No IntersectionObserver: we reveal immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number
  rootMargin?: string
  /** Re-arm the observer when this value changes (e.g. after async content loads). */
  when?: unknown
}) {
  const ref = useRef<T>(null)
  const threshold = options?.threshold ?? 0.12
  const rootMargin = options?.rootMargin ?? '0px 0px -8% 0px'
  const when = options?.when

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If it's already been revealed (e.g. re-arm after data load), leave it be.
    if (el.classList.contains('is-visible')) return

    const reveal = () => el.classList.add('is-visible')

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      reveal()
      return
    }

    // Already in view when mounted? Reveal straight away, rather than waiting on
    // the observer's first callback. Covers above-the-fold content and keeps it
    // from lingering hidden if that callback is delayed.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, when])

  return ref
}

export default useReveal
