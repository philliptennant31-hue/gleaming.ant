import { cn } from '../../lib/cn'

interface WipeEdgeProps {
  /** CSS colour the seam introduces (the section it borders). */
  color?: string
  /**
   * Which side of the diagonal is painted:
   *  - 'down' (default): colour on the bottom — a section of `color` follows below.
   *  - 'up': colour on the top — a section of `color` sits above.
   */
  fillSide?: 'up' | 'down'
  className?: string
}

// A true −3° tilt (the angle of the pane in the logo). CSS gradient angles are
// real geometric angles, so the seam stays a constant −3° at any viewport width.
const ANGLE = '-3deg'

/**
 * The squeegee-wipe section seam. Drop it at the boundary between a light and a
 * deep-teal section; it paints a crisp −3° diagonal in `color`, as if a squeegee
 * just swept across. The un-painted half is transparent, showing the page behind.
 */
export function WipeEdge({ color = 'var(--color-teal-deep)', fillSide = 'down', className }: WipeEdgeProps) {
  const edgeA = 'calc(50% - 0.6px)'
  const edgeB = 'calc(50% + 0.6px)'
  const background =
    fillSide === 'up'
      ? `linear-gradient(${ANGLE}, transparent 0 ${edgeA}, ${color} ${edgeB} 100%)`
      : `linear-gradient(${ANGLE}, ${color} 0 ${edgeA}, transparent ${edgeB} 100%)`

  return (
    <div
      aria-hidden="true"
      className={cn('w-full', className)}
      style={{ height: 'clamp(2rem, 5vw, 4rem)', background }}
    />
  )
}

export default WipeEdge
