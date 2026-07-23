import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { InstagramIcon } from '../components/brand/icons'
import {
  MapPinIcon,
  PoundCoinIcon,
  QuoteCalcIcon,
  SparkleBurstIcon,
  SqueegeeIcon,
} from '../components/brand/icons-brand'
import { useAsync } from '../lib/useAsync'
import { fetchActiveServices } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { INSTAGRAM_URL } from '../lib/nav'
import type { Service } from '../lib/types'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states'
import { WipeEdge } from '../components/brand/WipeEdge'
import { Sparkle } from '../components/brand/Sparkle'
import { TrustChips } from '../components/site/TrustChips'
import { ServiceCard } from '../components/site/ServiceCard'
import { HeroArt } from '../components/site/HeroArt'
import { QuoteStarter } from '../components/site/QuoteStarter'
import { Reveal } from '../components/site/Reveal'
import { BeforeAfterSlider } from '../components/site/BeforeAfterSlider'
import { cn } from '../lib/cn'

const STEPS = [
  {
    icon: QuoteCalcIcon,
    title: 'Pick your quote',
    body: 'Tell us your property and what you need. Our instant quote gives you a fair, upfront price. No waiting around.',
  },
  {
    icon: SqueegeeIcon,
    title: 'We clean',
    body: "We send a friendly reminder before every visit, turn up when we say we will, and leave everything gleaming: windows, frames and sills included.",
  },
  {
    icon: PoundCoinIcon,
    title: 'Pay after',
    body: 'Settle up once the job is done and you are happy. [PLACEHOLDER: payment methods — e.g. bank transfer, card, direct debit]',
  },
]

const AREAS = ['Basildon', 'Billericay', 'Wickford', 'Brentwood', 'Chelmsford', 'Rayleigh', 'South Woodham Ferrers']

function ServicesSection() {
  const { data, loading, error, reload } = useAsync<Service[]>(fetchActiveServices, [])

  return (
    <section className="py-16 sm:py-20" aria-labelledby="services-heading">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="services-heading"
            eyebrow="What we clean"
            title="Exterior cleaning, done properly"
            description="From a quick window round to the full frontage. Pick what you need, or bundle a few and save."
            className="max-w-2xl"
          />
          <Button to="/services" variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
            All services
          </Button>
        </div>

        <div className="mt-10">
          {loading && <LoadingState message="Loading services…" />}
          {error && <ErrorState onRetry={reload} />}
          {!loading && !error && data && data.length === 0 && (
            <EmptyState
              icon={<SparkleBurstIcon className="h-6 w-6" />}
              title="Services coming soon"
              body="We're getting our service list ready. Message us in the meantime and we'll help."
            />
          )}
          {!loading && !error && data && data.length > 0 && (
            <Reveal as="div" stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  )
}

const WORK_PAIRS = {
  window: {
    tab: 'Windows',
    before: '/images/work/window-before.jpg',
    after: '/images/work/window-after.jpg',
    beforeAlt: 'Dormer windows before cleaning, the glass dulled with dirt and watermarks',
    afterAlt: 'The same dormer windows after cleaning, the glass left clear',
    caption: 'Dormer windows on an Essex home, cleaned with our pure-water poles.',
  },
  door: {
    tab: 'Doors & frames',
    before: '/images/work/door-before.jpg',
    after: '/images/work/door-after.jpg',
    beforeAlt: 'A uPVC door frame and sill before cleaning, marked with grime and black spotting',
    afterAlt: 'The same uPVC door frame and sill after cleaning, back to clean white',
    caption: 'A uPVC door frame and sill brought back to white on the same round.',
  },
} as const

type WorkPairKey = keyof typeof WORK_PAIRS

/** "See the difference": honest before/after sliders from real jobs, + IG CTA. */
function WorkShowcase() {
  const [pair, setPair] = useState<WorkPairKey>('window')
  const active = WORK_PAIRS[pair]

  return (
    <section className="py-16 sm:py-20" aria-labelledby="work-heading">
      <Container>
        <Reveal className="mx-auto max-w-2xl">
          <SectionHeading
            id="work-heading"
            align="center"
            eyebrow="See the difference"
            title="Real jobs, shot on the round"
            description="No stock photos here. These are our own before-and-afters, taken on the job across Essex. Drag the slider to see the change."
          />
        </Reveal>

        <Reveal className="mx-auto mt-9 max-w-2xl">
          <div role="group" aria-label="Choose a before and after example" className="flex justify-center gap-2">
            {(Object.keys(WORK_PAIRS) as WorkPairKey[]).map((key) => {
              const selected = key === pair
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPair(key)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                    selected
                      ? 'bg-teal-deep text-white'
                      : 'border border-pane bg-white text-ink-soft hover:bg-pane/50',
                  )}
                >
                  {WORK_PAIRS[key].tab}
                </button>
              )
            })}
          </div>

          <BeforeAfterSlider
            key={pair}
            beforeSrc={active.before}
            afterSrc={active.after}
            beforeAlt={active.beforeAlt}
            afterAlt={active.afterAlt}
            width={600}
            height={555}
            className="mt-5"
          />

          <p className="mt-4 text-center text-sm text-ink-soft">
            {active.caption} Real customer jobs, phone-shot as we work.
          </p>

          <div className="mt-6 flex justify-center">
            <Button
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              leftIcon={<InstagramIcon className="h-4 w-4" />}
            >
              See more on Instagram
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

export default function Home() {
  useDocumentTitle('Gleaming Ant | Window & Exterior Cleaning in Essex')

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="bg-chalkboard on-deep relative overflow-hidden text-white">
        <Sparkle size={20} className="twinkle absolute left-[6%] top-16 text-pane/40" />
        <Sparkle size={14} className="twinkle twinkle-2 absolute right-[45%] top-10 text-white/50" />

        {/* Height-constrained so the whole hero (headline block + card) sits in
            one viewport; the content is vertically centred within it. */}
        <div className="flex min-h-[min(88svh,820px)] items-center">
          <Container className="relative w-full py-10 sm:py-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-pane">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  Essex · Window &amp; exterior cleaning
                </span>

                <h1 className="wipe-headline rise-in mt-4 max-w-xl font-display text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Gleaming windows. Tidy gutters. One friendly visit.
                </h1>

                <p className="rise-in rise-in-2 mt-4 max-w-lg text-lg leading-relaxed text-pane/85">
                  We're the small, hardworking local team keeping Essex homes bright. Reliable,
                  friendly and fully insured, on a regular round or a one-off spruce-up.
                </p>

                <div className="rise-in rise-in-3 mt-6 flex flex-wrap gap-3">
                  <Button to="/booking" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                    Get an instant quote
                  </Button>
                  <Button to="/pricing" size="lg" variant="secondary" onDark>
                    See our prices
                  </Button>
                </div>

                <TrustChips tone="light" className="rise-in rise-in-4 mt-6" />
              </div>

              <div className="rise-in rise-in-2">
                <HeroArt>
                  <QuoteStarter
                    supportLine="Tell us your property and what needs cleaning — instant price, nothing to pay now."
                    sizeLabel="Your property"
                  />
                </HeroArt>
              </div>
            </div>
          </Container>
        </div>

        <WipeEdge color="var(--color-paper)" fillSide="down" />
      </section>

      {/* ------------------------------------------------------------ Services */}
      <ServicesSection />

      {/* --------------------------------------------------------- How it works */}
      <section className="border-y border-pane bg-pane/35 py-16 sm:py-20" aria-labelledby="how-heading">
        <Container>
          <SectionHeading
            id="how-heading"
            align="center"
            eyebrow="How it works"
            title="Three steps to spotless"
            description="No phone tag, no vague promises. Here's exactly how a Gleaming Ant clean goes."
          />
          <Reveal as="ol" stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-card border border-pane bg-white p-7 shadow-card">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pane">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-3xl font-semibold text-pane" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Areas strip */}
      <section className="py-14" aria-labelledby="areas-strip-heading">
        <Container>
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <h2 id="areas-strip-heading" className="font-display text-2xl font-bold text-ink">
              Out and about across Essex
            </h2>
            <ul className="flex flex-wrap justify-center gap-2.5">
              {AREAS.map((area) => (
                <li
                  key={area}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pane bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft"
                >
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {area}
                </li>
              ))}
            </ul>
            <Button to="/areas" variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Check we cover your postcode
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ------------------------------------------------- Regular-clean pitch */}
      <WipeEdge color="var(--color-teal-deep)" fillSide="down" className="-mb-px" />
      <section className="bg-chalkboard on-deep relative overflow-hidden text-white" aria-labelledby="regular-heading">
        <Sparkle size={18} className="twinkle absolute right-[10%] top-12 text-pane/40" />
        <Container className="py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                id="regular-heading"
                tone="light"
                eyebrow="Regular rounds"
                title="Every 4 weeks, like clockwork"
                description="Most of our customers go regular. It keeps windows consistently spotless and costs less per visit than a one-off. Set it once and forget it; we'll be there."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to="/booking" size="lg">
                  Start a regular clean
                </Button>
                <Button to="/pricing" size="lg" variant="secondary" onDark>
                  Compare frequencies
                </Button>
              </div>
            </div>

            <Reveal as="ul" stagger className="grid gap-4 sm:grid-cols-2">
              {[
                { h: 'Best price per visit', p: 'Regular 4-weekly cleans are our lowest rate.' },
                { h: 'Never a chore', p: "We remember your schedule so you don't have to." },
                { h: 'Flexible', p: 'Switch to 8-weekly or pause any time. Just ask.' },
                { h: 'No contracts', p: 'Stay because the windows are gleaming, not the small print.' },
              ].map((item) => (
                <li key={item.h} className="rounded-card border border-white/12 bg-white/5 p-5">
                  <h3 className="font-display text-lg font-bold text-white">{item.h}</h3>
                  <p className="mt-1.5 text-sm text-pane/80">{item.p}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </Container>
      </section>
      <WipeEdge color="var(--color-teal-deep)" fillSide="up" className="-mt-px" />

      {/* -------------------------------------------------- See the difference */}
      <WorkShowcase />

      {/* ------------------------------------------------------------ Final CTA */}
      <section className="border-t border-pane bg-pane/40 py-16 sm:py-20" aria-labelledby="cta-heading">
        <Container>
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <Sparkle size={22} className="text-teal" />
            <SectionHeading
              id="cta-heading"
              align="center"
              title="Ready for gleaming windows?"
              description="Get a free, instant quote in under a minute. No obligation, and we won't hassle you with calls."
            />
            <div className="flex flex-wrap justify-center gap-3">
              <Button to="/booking" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Get an instant quote
              </Button>
              <Button to="/contact" size="lg" variant="secondary">
                Message us
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
