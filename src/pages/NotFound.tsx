import { ArrowRight, Home } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { AntMascot } from '../components/brand/AntMascot'
import { Sparkle } from '../components/brand/Sparkle'

export default function NotFound() {
  useDocumentTitle('Page not found | Gleaming Ant')

  return (
    <section className="relative flex min-h-[70vh] items-center py-16">
      <Container>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
          <div className="relative">
            <Sparkle size={22} className="twinkle absolute -left-6 top-2 text-teal/50" />
            <Sparkle size={14} className="twinkle twinkle-2 absolute -right-4 top-6 text-amber/60" />
            <div className="ant-bob">
              <AntMascot size={160} title="A slightly lost Gleaming Ant" />
            </div>
          </div>

          <p className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-teal-deep">
            Error 404
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            This page needs a clean
          </h1>
          <p className="max-w-md text-lg text-ink-soft">
            We couldn't find what you were after. Even our busiest ant takes a wrong turn now and then.
            Let's get you back to something gleaming.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button to="/" leftIcon={<Home className="h-4 w-4" />}>
              Back home
            </Button>
            <Button to="/booking" variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get an instant quote
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
