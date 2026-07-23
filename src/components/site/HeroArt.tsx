import type { ReactNode } from 'react'
import { Sparkle } from '../brand/Sparkle'

/**
 * Hero backdrop — Antony out on the round, reaching up with the water-fed pole
 * to clean an upstairs window against a bright Essex sky. The photo fills the
 * top of the hero's right column as a rounded panel at a controlled height
 * (`object-cover`) and the QuoteStarter card (passed as `children`) sits BELOW
 * it, pulled up so it tucks over only the photo's bottom strip. The photo stays
 * mostly visible above the card and the whole hero still fits inside one
 * viewport. A gradient scrim darkens the foot of the photo so the card overlaps
 * cleanly and stays AA-legible.
 *
 * The oversized Gleaming Ant badge that used to fill this space has been
 * removed: the logo stays at header/footer scale rather than dominating the
 * hero's prime spot, which the instant-quote card now owns. The one-time
 * "just cleaned" sheen and a couple of ambient sparkles are kept.
 */
export function HeroArt({ children }: { children?: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md select-none lg:max-w-none">
      {/* soft glow behind the panel */}
      <div className="absolute -inset-8 rounded-[2.5rem] bg-teal/25 blur-3xl" aria-hidden="true" />

      {/* Photo panel: a short banner on mobile, a taller panel at the top of the
          right column on desktop (clamped so the hero fits the fold and the card
          can tuck below it). */}
      <div className="hero-sheen relative h-52 overflow-hidden rounded-[1.75rem] border border-white/15 shadow-lift sm:h-64 lg:h-[clamp(270px,36vh,400px)]">
        <img
          src="/images/work/antony-reach-pole.jpg"
          alt="Antony from Gleaming Ant reaching up with a water-fed pole to clean an upstairs window against a clear blue sky"
          width={750}
          height={1000}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* scrim: darken toward the foot so the card overlaps cleanly (AA) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent"
        />
        {/* small clean-glass sparkle accent */}
        <Sparkle size={20} className="twinkle absolute right-4 top-4 text-white/90" />
      </div>

      {/* QuoteStarter card: sits below the panel and is pulled up with a
          negative top margin so it tucks over only the photo's bottom strip.
          Centred at every width, and always narrower than the panel so the
          photo stays visible around it (never full-bleed). */}
      <div className="relative z-10 mx-auto -mt-10 w-[min(400px,calc(100%_-_2rem))] lg:-mt-20 lg:w-[min(400px,calc(100%_-_48px))]">
        {children}
      </div>
    </div>
  )
}

export default HeroArt
