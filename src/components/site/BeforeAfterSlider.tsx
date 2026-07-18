import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../../lib/cn'

/* -------------------------------------------------------------------------- *
 * Pure helpers (unit-tested in __tests__/BeforeAfterSlider.test.ts)
 * -------------------------------------------------------------------------- */

/** Clamp any number into the 0–100 divider range. */
export function clampPercent(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, n))
}

/** Divider position (0–100) for a pointer at `clientX` over an element `rect`. */
export function percentFromClientX(clientX: number, rect: { left: number; width: number }): number {
  if (!rect.width) return 0
  return clampPercent(((clientX - rect.left) / rect.width) * 100)
}

const KEY_STEP = 4
const KEY_PAGE = 16

/**
 * Next divider value for a keydown, or `null` if the key isn't one we handle
 * (so the caller can leave the event alone). Left/Down nudge toward "before",
 * Right/Up toward "after"; Page keys jump; Home/End go to the ends.
 */
export function nextSliderValue(current: number, key: string): number | null {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampPercent(current - KEY_STEP)
    case 'ArrowRight':
    case 'ArrowUp':
      return clampPercent(current + KEY_STEP)
    case 'PageDown':
      return clampPercent(current - KEY_PAGE)
    case 'PageUp':
      return clampPercent(current + KEY_PAGE)
    case 'Home':
      return 0
    case 'End':
      return 100
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- *
 * Component
 * -------------------------------------------------------------------------- */

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
  /** Intrinsic pixel dimensions of the images — set to lock the box (no CLS). */
  width: number
  height: number
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

/**
 * Draggable before/after comparison. The "after" image is the base; the
 * "before" image is clipped to the left of the divider. Works with mouse, touch
 * (drag the handle) and keyboard (focus the handle, arrow keys move it). The
 * handle is a proper `role="slider"` with `aria-valuenow`. Under reduced motion
 * there's no hint sweep; otherwise the divider gives one gentle nudge the first
 * time it scrolls into view, to signal it's draggable. No external deps.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  width,
  height,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [hinting, setHinting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const interactedRef = useRef(false)
  const hintTimers = useRef<number[]>([])

  const clearHintTimers = useCallback(() => {
    hintTimers.current.forEach((t) => window.clearTimeout(t))
    hintTimers.current = []
  }, [])

  const stopHint = useCallback(() => {
    interactedRef.current = true
    clearHintTimers()
    setHinting(false)
  }, [clearHintTimers])

  const moveFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    setPos(percentFromClientX(clientX, el.getBoundingClientRect()))
  }, [])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      // On touch, only start when the handle itself is grabbed, so a vertical
      // swipe over the photo still scrolls the page.
      const onHandle = !!handleRef.current && (e.target === handleRef.current || handleRef.current.contains(e.target as Node))
      if (e.pointerType !== 'mouse' && !onHandle) return
      stopHint()
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      moveFromClientX(e.clientX)
    },
    [moveFromClientX, stopHint],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      moveFromClientX(e.clientX)
    },
    [dragging, moveFromClientX],
  )

  const endDrag = useCallback(() => setDragging(false), [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      const next = nextSliderValue(pos, e.key)
      if (next === null) return
      e.preventDefault()
      stopHint()
      setPos(next)
    },
    [pos, stopHint],
  )

  // One-time hint nudge when the slider first scrolls into view (motion only).
  useEffect(() => {
    const el = containerRef.current
    if (!el || interactedRef.current) return

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return

    const playHint = () => {
      if (interactedRef.current) return
      setHinting(true)
      hintTimers.current.push(window.setTimeout(() => setPos(66), 60))
      hintTimers.current.push(window.setTimeout(() => setPos(50), 720))
      hintTimers.current.push(
        window.setTimeout(() => {
          if (!interactedRef.current) setHinting(false)
        }, 1400),
      )
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target)
            playHint()
          }
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearHintTimers()
    }
  }, [clearHintTimers])

  const rounded = Math.round(pos)

  return (
    <figure className={cn('m-0', className)}>
      <div
        ref={containerRef}
        className={cn(
          'relative w-full select-none overflow-hidden rounded-card border border-pane bg-pane shadow-card',
          hinting && 'ba-hinting',
        )}
        style={{ aspectRatio: `${width} / ${height}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {/* Base: the "after" image */}
        <img
          src={afterSrc}
          alt={afterAlt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay: the "before" image, clipped to the left of the divider */}
        <img
          src={beforeSrc}
          alt={beforeAlt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="ba-reveal absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        {/* Corner labels */}
        <figcaption className="pointer-events-none absolute inset-0">
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {beforeLabel}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {afterLabel}
          </span>
        </figcaption>

        {/* Divider + handle */}
        <div
          aria-hidden="true"
          className="ba-divider pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_0_1px_rgba(34,65,79,0.15)]"
          style={{ left: `${pos}%` }}
        />
        <button
          ref={handleRef}
          type="button"
          role="slider"
          aria-label="Drag to compare the before and after photos"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rounded}
          aria-valuetext={`${rounded}% revealed`}
          onKeyDown={onKeyDown}
          className="ba-divider absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-pane bg-white text-teal-deep shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          style={{ left: `${pos}%`, touchAction: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 8l-4 4 4 4M14 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </figure>
  )
}

export default BeforeAfterSlider
