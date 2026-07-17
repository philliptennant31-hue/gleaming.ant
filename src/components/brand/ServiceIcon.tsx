import { Droplets, Grid2x2, House, Sparkles, Sun, Waves, Zap, type LucideIcon } from 'lucide-react'

// Maps the DB `services.icon` string to a lucide icon.
const ICONS: Record<string, LucideIcon> = {
  window: Grid2x2,
  gutter: Waves,
  fascia: House,
  conservatory: Sun,
  solar: Zap,
  pressure: Droplets,
  sparkles: Sparkles,
}

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}

export default ServiceIcon
