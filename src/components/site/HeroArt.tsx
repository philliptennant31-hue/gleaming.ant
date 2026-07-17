import { AntMascot } from '../brand/AntMascot'
import { Sparkle } from '../brand/Sparkle'

/**
 * Hero illustration: the ant squeegeeing a tilted window pane. One of only two
 * places the mascot appears (the other is the booking stepper, Phase 2).
 */
export function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none" aria-hidden="false">
      {/* soft glow */}
      <div className="absolute -inset-8 rounded-[2.5rem] bg-teal/25 blur-3xl" aria-hidden="true" />

      <div className="relative aspect-square">
        {/* The window pane, tilted to the brand −3° */}
        <div className="absolute inset-6 -rotate-3 overflow-hidden rounded-[1.75rem] border-4 border-white/90 bg-gradient-to-br from-white via-pane to-pane shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)]">
          {/* mullions -> four panes */}
          <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-white/80" aria-hidden="true" />
          <div className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-white/80" aria-hidden="true" />
          {/* squeegee shine sweeping across the glass */}
          <div
            className="absolute -inset-x-6 top-4 h-16 rotate-[-24deg] bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[2px]"
            aria-hidden="true"
          />
        </div>

        {/* The ant at work, sitting over the lower pane (kept upright) */}
        <div className="ant-bob absolute bottom-3 left-1/2 -translate-x-1/2">
          <AntMascot size={190} title="The Gleaming Ant mascot cleaning a window with a squeegee" />
        </div>

        {/* Sparkles — clean-glass moments */}
        <Sparkle size={26} className="twinkle absolute left-2 top-6 text-white" />
        <Sparkle size={16} className="twinkle twinkle-2 absolute right-6 top-2 text-pane" />
        <Sparkle size={13} className="twinkle twinkle-3 absolute right-2 bottom-16 text-white" />
      </div>
    </div>
  )
}

export default HeroArt
