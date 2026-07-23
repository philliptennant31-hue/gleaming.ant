import { Sparkle } from '../brand/Sparkle'

/**
 * Hero backdrop — the third column of the hero row. Antony out on the round,
 * reaching up with the water-fed pole to clean an upstairs window against a
 * bright Essex sky. The photo fills its column at full height on desktop
 * (`object-cover`) and drops to a short banner beneath the quote card on mobile.
 * It stands on its own now: the QuoteStarter is its own column to the left, so
 * nothing overlaps the photo and it stays fully visible. The one-time "just
 * cleaned" sheen and a small sparkle accent are kept.
 */
export function HeroArt() {
  return (
    <div className="relative select-none">
      {/* soft glow behind the panel */}
      <div className="absolute -inset-8 rounded-[2.5rem] bg-teal/25 blur-3xl" aria-hidden="true" />

      {/* Photo panel: a short banner on mobile, a full-height column panel on
          desktop (clamped so the whole hero still fits inside one viewport). */}
      <div className="hero-sheen relative h-[200px] w-full overflow-hidden rounded-[1.75rem] border border-white/15 shadow-lift sm:h-[240px] lg:h-[clamp(420px,56vh,600px)]">
        <img
          src="/images/work/antony-reach-pole.jpg"
          alt="Antony from Gleaming Ant reaching up with a water-fed pole to clean an upstairs window against a clear blue sky"
          width={750}
          height={1000}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* subtle top scrim so the sparkle accent stays legible */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ink/45 to-transparent"
        />
        {/* small clean-glass sparkle accent */}
        <Sparkle size={20} className="twinkle absolute right-4 top-4 text-white/90" />
      </div>
    </div>
  )
}

export default HeroArt
