import { BrandBadge } from '../brand/BrandBadge'
import { Sparkle } from '../brand/Sparkle'

/**
 * Hero illustration: the full Gleaming Ant badge (ant squeegeeing a tilted
 * window pane, banners and all), with a soft glow and a few ambient sparkles
 * twinkling around it.
 */
export function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      {/* soft glow */}
      <div className="absolute -inset-8 rounded-[2.5rem] bg-teal/25 blur-3xl" aria-hidden="true" />

      <div className="relative">
        <BrandBadge
          size={480}
          className="h-auto w-full drop-shadow-[0_30px_60px_-30px_rgba(34,65,79,0.55)]"
          title="The Gleaming Ant badge: a little ant squeegeeing a window, over banners reading Gleaming Ant and Window & Exterior Cleaning"
        />

        {/* Ambient sparkles — clean-glass moments around the badge */}
        <Sparkle size={28} className="twinkle absolute -left-1 top-6 text-white" />
        <Sparkle size={18} className="twinkle twinkle-2 absolute right-2 top-1 text-pane" />
        <Sparkle size={15} className="twinkle twinkle-3 absolute -right-1 bottom-24 text-white" />
      </div>
    </div>
  )
}

export default HeroArt
