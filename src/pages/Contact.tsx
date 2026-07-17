import { useState } from 'react'
import { CheckCircle2, Mail, MessageCircle, Phone, TriangleAlert } from 'lucide-react'
import { submitContactMessage } from '../lib/api'
import { InstagramIcon } from '../components/brand/icons'
import { useSiteSettings } from '../lib/settings'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { INSTAGRAM_URL } from '../lib/nav'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Spinner } from '../components/ui/Spinner'
import { PageHeader } from '../components/layout/PageHeader'

type Status = 'idle' | 'submitting' | 'success' | 'error'
interface FormValues {
  name: string
  email: string
  phone: string
  message: string
}
const EMPTY: FormValues = { name: '', email: '', phone: '', message: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isPlaceholder(value: string) {
  return !value || value.startsWith('[PLACEHOLDER')
}

function ContactDetail({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pane text-teal-deep">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
        {isPlaceholder(value) ? (
          <p className="font-mono text-sm text-ink-soft">[PLACEHOLDER]</p>
        ) : href ? (
          <a href={href} className="font-medium text-ink hover:text-teal-deep">
            {value}
          </a>
        ) : (
          <p className="font-medium text-ink">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function Contact() {
  useDocumentTitle('Contact Us | Gleaming Ant')
  const { settings } = useSiteSettings()
  const { contact } = settings

  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [status, setStatus] = useState<Status>('idle')

  function update(field: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormValues, string>> = {}
    if (!values.name.trim()) next.name = 'Please tell us your name.'
    if (!values.email.trim()) next.email = 'We need an email to reply to.'
    else if (!EMAIL_RE.test(values.email.trim())) next.email = 'That email doesn’t look right.'
    if (!values.message.trim()) next.message = 'Let us know how we can help.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    if (!validate()) return
    setStatus('submitting')
    try {
      await submitContactMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
      })
      setStatus('success')
      setValues(EMPTY)
    } catch {
      setStatus('error')
    }
  }

  const waHref = isPlaceholder(contact.whatsapp)
    ? undefined
    : `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, '')}`

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk"
        lead="Got a question, or after a quote for something specific? Send us a message and we'll get back to you."
      />

      <section className="py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            {/* Form / success */}
            <div className="rounded-card border border-pane bg-white p-6 shadow-card sm:p-8">
              {status === 'success' ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-teal-deep">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-2xl font-bold text-ink">Message sent — thank you</h2>
                  <p className="max-w-sm text-ink-soft">
                    We've got your message and will be in touch as soon as we can. For anything urgent,
                    reach us on the details listed here.
                  </p>
                  <Button variant="secondary" onClick={() => setStatus('idle')}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <h2 className="font-display text-2xl font-bold text-ink">Send us a message</h2>
                  <p className="mt-1 text-sm text-ink-soft">We usually reply the same day.</p>

                  {status === 'error' && (
                    <div
                      role="alert"
                      className="mt-5 flex items-start gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
                    >
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Something went wrong sending your message. Please try again, or reach us using the
                        contact details on this page.
                      </span>
                    </div>
                  )}

                  <div className="mt-6 grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Your name"
                        required
                        autoComplete="name"
                        value={values.name}
                        onChange={(e) => update('name', e.target.value)}
                        error={errors.name}
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        autoComplete="tel"
                        hint="Optional"
                        value={values.phone}
                        onChange={(e) => update('phone', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Email"
                      type="email"
                      required
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => update('email', e.target.value)}
                      error={errors.email}
                    />
                    <Textarea
                      label="How can we help?"
                      required
                      rows={5}
                      placeholder="Tell us what you need — the more detail, the better."
                      value={values.message}
                      onChange={(e) => update('message', e.target.value)}
                      error={errors.message}
                    />
                    <div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={status === 'submitting'}
                        leftIcon={status === 'submitting' ? <Spinner size={18} className="text-ink" /> : undefined}
                      >
                        {status === 'submitting' ? 'Sending…' : 'Send message'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Details */}
            <aside className="space-y-6">
              <div className="rounded-card border border-pane bg-white p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-ink">Reach us directly</h2>
                <div className="mt-5 space-y-4">
                  <ContactDetail
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={contact.phone}
                    href={isPlaceholder(contact.phone) ? undefined : `tel:${contact.phone.replace(/\s/g, '')}`}
                  />
                  <ContactDetail
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={contact.email}
                    href={isPlaceholder(contact.email) ? undefined : `mailto:${contact.email}`}
                  />
                  <ContactDetail
                    icon={<MessageCircle className="h-4 w-4" />}
                    label="WhatsApp"
                    value={contact.whatsapp}
                    href={waHref}
                  />
                </div>
              </div>

              <div className="rounded-card border border-pane bg-pane/30 p-6">
                <h2 className="font-display text-lg font-bold text-ink">Prefer socials?</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Follow along and message us on Instagram — before-and-afters go up there too.
                </p>
                <div className="mt-4">
                  <Button
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    leftIcon={<InstagramIcon className="h-4 w-4" />}
                  >
                    @gleaming.ant
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  )
}
