import type { MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Recolour secondary/ghost for placement on deep-teal surfaces. */
  onDark?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  children?: ReactNode
  /** Internal route -> renders a react-router Link. */
  to?: string
  /** External/absolute href -> renders an anchor. */
  href?: string
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLElement>
  title?: string
  'aria-label'?: string
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-semibold leading-none whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-55'

const sizes: Record<ButtonSize, string> = {
  sm: 'text-sm px-3.5 py-2',
  md: 'text-[0.95rem] px-5 py-2.5',
  lg: 'text-base px-6 py-3.5',
}

function variantClass(variant: ButtonVariant, onDark: boolean): string {
  switch (variant) {
    case 'primary':
      return 'bg-amber text-ink shadow-[0_8px_20px_-10px_rgba(224,145,61,0.85)] hover:bg-amber-deep hover:shadow-[0_10px_24px_-10px_rgba(199,123,43,0.9)]'
    case 'secondary':
      return onDark
        ? 'border-2 border-white/70 text-white bg-transparent hover:bg-white hover:text-teal-deep'
        : 'border-2 border-teal-deep text-teal-deep bg-transparent hover:bg-teal-deep hover:text-white'
    case 'ghost':
      return onDark
        ? 'text-white bg-transparent hover:bg-white/10'
        : 'text-teal-deep bg-transparent hover:bg-pane/70'
  }
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    onDark = false,
    fullWidth,
    leftIcon,
    rightIcon,
    className,
    children,
    to,
    href,
    target,
    rel,
    type = 'button',
    disabled,
    onClick,
    title,
  } = props

  const classes = cn(base, sizes[size], variantClass(variant, onDark), fullWidth && 'w-full', className)

  const content = (
    <>
      {leftIcon}
      {children ? <span>{children}</span> : null}
      {rightIcon}
    </>
  )

  const shared = {
    className: classes,
    onClick,
    title,
    'aria-label': props['aria-label'],
  }

  if (to && !disabled) {
    return (
      <Link to={to} {...shared} aria-expanded={props['aria-expanded']} aria-controls={props['aria-controls']}>
        {content}
      </Link>
    )
  }

  if (href && !disabled) {
    return (
      <a href={href} target={target} rel={rel ?? (target === '_blank' ? 'noreferrer' : undefined)} {...shared}>
        {content}
      </a>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      {...shared}
      aria-expanded={props['aria-expanded']}
      aria-controls={props['aria-controls']}
    >
      {content}
    </button>
  )
}

export default Button
