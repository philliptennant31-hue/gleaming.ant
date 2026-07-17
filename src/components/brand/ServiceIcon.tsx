import type { ComponentType } from 'react'
import {
  ConservatoryIcon,
  FasciaIcon,
  GutterIcon,
  PressureWashIcon,
  SolarIcon,
  SparkleBurstIcon,
  WindowPaneIcon,
  type BrandIconProps,
} from './icons-brand'

// Maps the DB `services.icon` string to a bespoke sticker mark (icons-brand.tsx),
// drawn in the BrandBadge's visual language. Unknown keys fall back to the
// brand sparkle.
const ICONS: Record<string, ComponentType<BrandIconProps>> = {
  window: WindowPaneIcon,
  gutter: GutterIcon,
  fascia: FasciaIcon,
  conservatory: ConservatoryIcon,
  solar: SolarIcon,
  pressure: PressureWashIcon,
  sparkles: SparkleBurstIcon,
}

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? SparkleBurstIcon
  return <Icon className={className} />
}

export default ServiceIcon
