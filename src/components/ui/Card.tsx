import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  /** Adds a hover lift. Automatically on when `to` is set. */
  interactive?: boolean
  /** Renders the card as a react-router Link. */
  to?: string
}

const base = 'rounded-card border border-pane bg-white shadow-card'
const lift =
  'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-teal/40'

export function Card({ children, className, interactive, to }: CardProps) {
  if (to) {
    return (
      <Link to={to} className={cn(base, lift, 'block', className)}>
        {children}
      </Link>
    )
  }
  return <div className={cn(base, interactive && lift, className)}>{children}</div>
}

export default Card
