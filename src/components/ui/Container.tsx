import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  /** Narrower measure for reading-heavy pages (legal, about). */
  size?: 'default' | 'narrow'
}

/** Centres content to the brand max measure (72rem) with responsive gutters. */
export function Container({ children, className, size = 'default' }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-6 lg:px-8',
        size === 'narrow' ? 'max-w-3xl' : 'max-w-[72rem]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default Container
