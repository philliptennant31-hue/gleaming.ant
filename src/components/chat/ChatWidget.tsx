/**
 * Sparkle — the Gleaming Ant site assistant.
 *
 * A floating amber launcher (bottom-right) that opens an accessible chat panel
 * (380px card on desktop, full-width bottom sheet on mobile). Talks to the
 * `/api/chat` serverless function; degrades to a friendly inline notice when the
 * endpoint is unreachable (e.g. running the Vite dev server without `netlify
 * dev`). Hidden on /admin routes. Transcript persists in sessionStorage.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ArrowRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkle } from '../brand/Sparkle'
import { cn } from '../../lib/cn'
import { draftReadiness, isChatTeaserDismissed, rememberChatTeaserDismissed } from './types'
import type { ChatResponse, DisplayMessage, QuoteDraft } from './types'

const STORAGE_KEY = 'ga_sparkle_chat_v1'
const MAX_INPUT = 600
const MAX_HISTORY = 12

// The one-time launcher teaser: a short line in Sparkle's voice, shown a few
// seconds after load so the chat is easy to find without shouting.
const TEASER_LINE = "Hi, I'm Sparkle. Ask me for a price any time."
const TEASER_SHOW_DELAY_MS = 4000
const TEASER_AUTO_HIDE_MS = 12000

const GREETING =
  "Hi! I'm Sparkle, the Gleaming Ant assistant. I can help with our services, prices, the areas we cover and booking. What can I help you with?"

const STARTERS = [
  'What services do you offer?',
  'How much is window cleaning?',
  'Which areas do you cover?',
]

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Keep a quote draft only when it carries at least one service. */
function cleanQuoteDraft(draft: QuoteDraft | undefined): QuoteDraft | undefined {
  if (!draft || !Array.isArray(draft.services)) return undefined
  const services = draft.services.filter((s) => typeof s === 'string' && s.trim().length > 0)
  return services.length > 0 ? { ...draft, services } : undefined
}

/** Build a shareable /booking URL from a draft (only present fields, encoded). */
function buildQuoteUrl(draft: QuoteDraft): string {
  const params = new URLSearchParams()
  params.set('services', draft.services.join(','))
  if (draft.band_code) params.set('band', draft.band_code)
  if (draft.frequency_code) params.set('frequency', draft.frequency_code)
  if (draft.postcode) params.set('postcode', draft.postcode)
  const qs = params.toString()
  return qs ? `/booking?${qs}` : '/booking'
}

function greetingMessage(): DisplayMessage {
  return {
    id: newId(),
    role: 'assistant',
    content: GREETING,
    suggestions: STARTERS,
    local: true,
  }
}

function loadTranscript(): DisplayMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is DisplayMessage =>
        !!m &&
        typeof m === 'object' &&
        typeof (m as DisplayMessage).content === 'string' &&
        ((m as DisplayMessage).role === 'user' || (m as DisplayMessage).role === 'assistant'),
    )
  } catch {
    return []
  }
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12l16-8-6 8 6 8-16-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  )
}

export default function ChatWidget() {
  const location = useLocation()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [hasEverOpened, setHasEverOpened] = useState(false)
  const [teaserOpen, setTeaserOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>(loadTranscript)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<DisplayMessage[]>(messages)
  const typingRef = useRef(false)

  // Keep refs in sync so `send` reads fresh values without stale closures.
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    typingRef.current = typing
  }, [typing])

  // Persist the transcript for this tab session.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // sessionStorage may be unavailable (private mode) — non-fatal.
    }
  }, [messages])

  // Auto-scroll to the latest message / typing indicator.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing, open])

  const closePanel = useCallback((restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) launcherRef.current?.focus()
  }, [])

  const handleClose = useCallback(() => closePanel(true), [closePanel])

  const dismissTeaser = useCallback(() => {
    setTeaserOpen(false)
    rememberChatTeaserDismissed(typeof window !== 'undefined' ? window.sessionStorage : null)
  }, [])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setHasEverOpened(true)
    dismissTeaser()
    setMessages((prev) => (prev.length === 0 ? [greetingMessage()] : prev))
  }, [dismissTeaser])

  // One-time launcher teaser: surface it a few seconds after load (unless the
  // visitor has already dismissed it this session), then auto-hide it. Opening
  // the chat also dismisses it (see handleOpen).
  useEffect(() => {
    const store = typeof window !== 'undefined' ? window.sessionStorage : null
    if (isChatTeaserDismissed(store)) return
    const showTimer = window.setTimeout(() => {
      // Re-check: the visitor may have opened the chat before the delay elapsed.
      if (!isChatTeaserDismissed(store)) setTeaserOpen(true)
    }, TEASER_SHOW_DELAY_MS)
    return () => window.clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (!teaserOpen) return
    const hideTimer = window.setTimeout(dismissTeaser, TEASER_AUTO_HIDE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [teaserOpen, dismissTeaser])

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim()
      if (!content || typingRef.current) return

      const userMessage: DisplayMessage = { id: newId(), role: 'user', content }
      const outgoing = [...messagesRef.current, userMessage]
        .filter((m) => !m.local)
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-MAX_HISTORY)

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      setTyping(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: outgoing, page: location.pathname }),
        })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = (await res.json()) as ChatResponse
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: data.reply,
            links: Array.isArray(data.links) ? data.links.slice(0, 2) : [],
            suggestions: Array.isArray(data.suggested_replies)
              ? data.suggested_replies.slice(0, 3)
              : [],
            quoteDraft: cleanQuoteDraft(data.quote_draft),
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            local: true,
            content:
              "I can't reach the assistant right now. Try the FAQ or message the team and they'll be happy to help.",
            links: [
              { label: 'Read our FAQs', path: '/faq' },
              { label: 'Message the team', path: '/contact' },
            ],
          },
        ])
      } finally {
        setTyping(false)
      }
    },
    [location.pathname],
  )

  const handleNavigate = useCallback(
    (path: string) => {
      closePanel(false)
      navigate(path)
    },
    [closePanel, navigate],
  )

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void send(input)
    },
    [input, send],
  )

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void send(input)
      }
    },
    [input, send],
  )

  const handleInputChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    const el = event.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }, [])

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  // Focus trap, Esc-to-close, and click-away — active only while open.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current
      if (!panel) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        handleClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, textarea, input, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (panelRef.current?.contains(target)) return
      if (launcherRef.current?.contains(target)) return
      handleClose()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, handleClose])

  // Never render on the admin app (also mounted only in the public Layout).
  if (location.pathname.startsWith('/admin')) return null

  // The booking wizard shows a fixed quote bar along the bottom on small
  // screens — lift the launcher clear of it there.
  const aboveQuoteBar = location.pathname.startsWith('/booking')

  return (
    <>
      {/* Launcher cluster: the round button, a "Chat with Sparkle" label chip to
          its left, and a one-time teaser bubble above it. */}
      <div
        className={cn(
          'fixed right-5 z-40 flex items-center gap-2.5 sm:right-6',
          aboveQuoteBar ? 'bottom-20 sm:bottom-6' : 'bottom-5 sm:bottom-6',
        )}
      >
        {/* Label chip — a mouse affordance that mirrors the launcher. Hidden
            while the panel is open and below ~380px so it never crowds the
            corner. Hidden from assistive tech, which uses the labelled button. */}
        {!open && (
          <button
            type="button"
            onClick={handleOpen}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden items-center gap-1.5 rounded-full bg-amber py-2 pl-3.5 pr-4 text-sm font-semibold text-ink shadow-lift transition-colors hover:bg-amber-deep min-[380px]:inline-flex"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-deep/70" />
            Chat with Sparkle
          </button>
        )}

        <div className="relative">
          {teaserOpen && !open && (
            <div
              role="status"
              className="chat-teaser absolute bottom-full right-0 mb-3 w-60 rounded-2xl rounded-br-sm border border-pane bg-white px-3.5 py-2.5 text-left shadow-lift"
            >
              <button
                type="button"
                onClick={dismissTeaser}
                aria-label="Dismiss"
                className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-pane hover:text-ink"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
              <p className="pr-4 text-sm leading-snug text-ink">{TEASER_LINE}</p>
            </div>
          )}

          <button
            ref={launcherRef}
            type="button"
            onClick={open ? handleClose : handleOpen}
            aria-label={open ? 'Close chat with Sparkle' : 'Chat with Sparkle'}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-full bg-amber text-ink shadow-lift transition-colors hover:bg-amber-deep',
              !hasEverOpened && 'chat-attention',
            )}
          >
            <Sparkle size={26} />
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Sparkle, here to help"
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-pane bg-paper shadow-lift sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-3rem)] sm:w-[380px] sm:rounded-card"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2.5 bg-teal-deep px-4 py-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
              <Sparkle size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[0.95rem] font-semibold leading-tight">Sparkle</p>
              <p className="text-xs text-pane">Here to help</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4"
          >
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1
              const isUser = message.role === 'user'
              const quoteDraft = cleanQuoteDraft(message.quoteDraft)
              // The handoff button already goes to /booking (prefilled), so
              // drop any plain /booking link that would duplicate it.
              const links = (message.links ?? []).filter(
                (link) => !quoteDraft || link.path !== '/booking',
              )
              return (
                <div
                  key={message.id}
                  className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'flex max-w-[85%] flex-col gap-2',
                      isUser ? 'items-end' : 'items-start',
                    )}
                  >
                    <div
                      className={cn(
                        'whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                        isUser
                          ? 'rounded-tr-sm bg-amber/20 text-ink'
                          : 'rounded-tl-sm bg-pane text-ink',
                      )}
                    >
                      {message.content}
                    </div>

                    {/* Quote handoff only on the latest turn: a loud amber CTA
                        once the draft is price-ready (service + property size),
                        otherwise a quiet skip-ahead link that never competes
                        with the question the visitor is still answering. */}
                    {isLast &&
                      quoteDraft &&
                      (draftReadiness(quoteDraft) === 'ready' ? (
                        <button
                          type="button"
                          onClick={() => handleNavigate(buildQuoteUrl(quoteDraft))}
                          className="inline-flex items-center gap-1.5 rounded-btn bg-amber px-3.5 py-2 text-xs font-bold text-ink shadow-card transition-colors hover:bg-amber-deep"
                        >
                          <Sparkle size={14} />
                          Continue your quote
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNavigate(buildQuoteUrl(quoteDraft))}
                          className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-teal-deep transition-all hover:gap-1.5 hover:text-ink"
                        >
                          Skip ahead to the quote form
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      ))}

                    {/* Navigation links: squarer shape + trailing arrow read as
                        "go somewhere", setting them apart from the round
                        suggestion pills below (which say the reply for you). */}
                    {links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {links.map((link) => (
                          <button
                            key={`${message.id}-${link.path}-${link.label}`}
                            type="button"
                            onClick={() => handleNavigate(link.path)}
                            aria-label={`Open ${link.label}`}
                            className="inline-flex items-center gap-1.5 rounded-btn border border-teal-deep/40 bg-white px-3 py-1.5 text-xs font-semibold text-teal-deep transition-colors hover:bg-pane"
                          >
                            {link.label}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    )}

                    {isLast && message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={`${message.id}-${suggestion}`}
                            type="button"
                            onClick={() => void send(suggestion)}
                            className="rounded-full border border-teal-deep/25 bg-white px-3 py-1 text-xs text-teal-deep transition-colors hover:bg-pane"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {typing && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-pane px-4 py-3"
                  role="status"
                  aria-label="Sparkle is typing"
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 animate-bounce rounded-full bg-teal-deep/60 motion-reduce:animate-none"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-end gap-2 border-t border-pane bg-white px-3 py-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              rows={1}
              maxLength={MAX_INPUT}
              placeholder="Ask Sparkle a question…"
              aria-label="Message Sparkle"
              className="max-h-28 flex-1 resize-none rounded-btn border border-pane bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-amber text-ink transition-colors hover:bg-amber-deep disabled:pointer-events-none disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
