import { ArrowRight } from 'lucide-react'
import { CalendarTickIcon, ShieldTickIcon, SmileIcon } from '../components/brand/icons-brand'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { PageHeader } from '../components/layout/PageHeader'
import { Logo } from '../components/brand/Logo'
import { Sparkle } from '../components/brand/Sparkle'
import { Reveal } from '../components/site/Reveal'

const VALUES = [
  {
    icon: CalendarTickIcon,
    title: 'Reliable',
    body: "We turn up when we say we will, on a schedule you can set your watch by. That's the whole point of a regular round.",
  },
  {
    icon: SmileIcon,
    title: 'Friendly',
    body: "A local face, not a faceless firm. We're easy to talk to and happy to work around you and your home.",
  },
  {
    icon: ShieldTickIcon,
    title: 'Fully insured',
    body: 'Your home is protected while we work. Fully insured means peace of mind for you and for us.',
  },
]

export default function About() {
  useDocumentTitle('About Us | Gleaming Ant')

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="The small team behind seriously clean windows"
        lead="Gleaming Ant is a young, hardworking local business, launched in 2026 to keep Essex homes bright, one friendly, reliable visit at a time."
      />

      {/* Story */}
      <section className="py-14 sm:py-16" aria-labelledby="story-heading">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
            <Reveal as="div">
              <h2 id="story-heading" className="font-display text-2xl font-bold text-ink">
                Our story
              </h2>
              <div className="mt-5 space-y-4 leading-relaxed text-ink">
                <p>
                  Gleaming Ant was founded by Antony, a local Essex window cleaner with a genuine passion for
                  delivering brilliant results on every job. What started with windows has grown into full
                  exterior cleaning, all run from our base in the Basildon area.
                </p>
                <p>
                  We've built our reputation the honest way: reliable service, real attention to detail, and
                  consistently high standards, visit after visit. No pushy sales and no cutting corners, just a
                  clean you'll notice and a team that turns up when we say we will.
                </p>
                <p>
                  Today we look after homes right across Essex, along with offices, shops, schools and a wide
                  range of commercial buildings. Whether it's a regular window round or the full frontage, you'll
                  get the same friendly, fully insured service every time.
                </p>
              </div>
            </Reveal>

            <Reveal as="div" className="flex justify-center lg:justify-end">
              <figure className="relative m-0 w-full max-w-xs">
                <div className="-rotate-1 overflow-hidden rounded-card border border-pane bg-white p-2 shadow-card">
                  <img
                    src="/images/work/antony-van.jpg"
                    alt="Antony, Gleaming Ant's founder, with the van and pure-water window cleaning kit"
                    width={750}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded-[8px] object-cover"
                  />
                </div>
                <Sparkle size={18} className="absolute -right-2 -top-2 text-teal/60" />
                <figcaption className="mt-4 text-center text-sm text-ink-soft">
                  Antony, out on the round with the pure-water kit.
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="border-y border-pane bg-pane/35 py-14 sm:py-16" aria-labelledby="values-heading">
        <Container>
          <SectionHeading
            id="values-heading"
            align="center"
            eyebrow="What we stand for"
            title="Reliable, friendly, fully insured"
            description="It's the promise in our bio, and it's how we run every single visit."
          />
          <Reveal as="div" stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-card border border-pane bg-white p-7 shadow-card">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pane">
                  <value.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{value.body}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Why the ant */}
      <section className="py-14 sm:py-16" aria-labelledby="ant-heading">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
            <Reveal as="div" className="relative flex justify-center">
              <div className="absolute -inset-4 rounded-[2rem] bg-pane/50 blur-2xl" aria-hidden="true" />
              <div className="relative rounded-card border border-pane bg-white px-10 py-12 shadow-card">
                <Sparkle size={18} className="absolute right-6 top-6 text-teal/40" />
                <Logo badgeSize={72} withTagline />
              </div>
            </Reveal>
            <Reveal as="div">
              <h2 id="ant-heading" className="font-display text-2xl font-bold text-ink">
                Why the ant?
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-ink">
                <p>
                  There's a nod to Antony in the name, but the ant fits the work too. Ants are small, yet
                  famously diligent and far stronger than they look. That's exactly the spirit we bring to
                  every job: quietly hardworking, paying attention to the details, and shifting more than
                  you'd expect from a small local team.
                </p>
                <p>
                  It's also a reminder to stay humble and do the little things well. A streak-free sill.
                  A gutter checked twice. The kind of care that keeps customers on the round for years.
                </p>
              </div>
              <div className="mt-7">
                <Button to="/booking" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Get an instant quote
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  )
}
