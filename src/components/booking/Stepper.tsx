import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { AntMascot } from '../brand/AntMascot'

interface StepperProps {
  steps: readonly string[]
  /** 1-based current step. */
  current: number
  /** 1-based furthest step the user may jump back to. */
  furthest: number
  onNavigate: (step: number) => void
}

/**
 * Booking progress stepper. The ant walks along the track to the active step
 * (a subtle horizontal glide + its idle bob; both stilled under
 * prefers-reduced-motion by the global reset in index.css). Completed steps are
 * clickable to jump back. The active step is the one sanctioned amber highlight
 * here (BRAND) alongside the primary action button.
 */
export function Stepper({ steps, current, furthest, onNavigate }: StepperProps) {
  const centerPct = (index: number) => (100 / steps.length) * (index + 0.5)
  const antLeft = centerPct(current - 1)

  return (
    <nav aria-label="Booking progress">
      {/* Compact textual cue for small screens */}
      <p className="mb-3 text-sm font-semibold text-ink-soft sm:hidden">
        Step {current} of {steps.length}:{' '}
        <span className="text-ink">{steps[current - 1]}</span>
      </p>

      <div className="relative pt-8">
        {/* The ant, gliding to the active step above the track */}
        <div
          className="pointer-events-none absolute top-0 z-10 transition-[left] duration-500 ease-out"
          style={{ left: `${antLeft}%`, transform: 'translateX(-50%)' }}
        >
          <AntMascot size={30} className="ant-bob" />
        </div>

        <div className="relative">
          {/* Track base + teal progress fill, centred on the 32px node row */}
          <div
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-4 h-1 -translate-y-1/2 rounded-full bg-pane"
          />
          <div
            aria-hidden="true"
            className="absolute left-[10%] top-4 h-1 -translate-y-1/2 rounded-full bg-teal transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(0, antLeft - 10)}%` }}
          />

          <ol className="relative grid grid-cols-5">
            {steps.map((label, index) => {
              const stepNumber = index + 1
              const isCurrent = stepNumber === current
              const isComplete = stepNumber < current
              const canNavigate = stepNumber <= furthest && !isCurrent

              const circle = (
                <span
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
                    isCurrent && 'bg-amber text-ink shadow-[0_6px_16px_-8px_rgba(224,145,61,0.9)]',
                    isComplete && 'bg-teal text-white',
                    !isCurrent && !isComplete && 'border border-pane bg-white text-ink-soft',
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : stepNumber}
                </span>
              )

              const labelEl = (
                <span
                  className={cn(
                    'mt-2 hidden text-center text-xs sm:block',
                    isCurrent ? 'font-semibold text-ink' : 'text-ink-soft',
                  )}
                >
                  {label}
                </span>
              )

              return (
                <li key={label} className="flex flex-col items-center">
                  {canNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(stepNumber)}
                      className="flex flex-col items-center rounded-lg focus-visible:outline-none"
                    >
                      {circle}
                      {labelEl}
                      <span className="sr-only">
                        {isComplete ? 'Completed — go back to this step' : 'Go to this step'}
                      </span>
                    </button>
                  ) : (
                    <span
                      className="flex flex-col items-center"
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {circle}
                      {labelEl}
                      {isCurrent && <span className="sr-only">Current step</span>}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </nav>
  )
}

export default Stepper
