import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

const VARIANTS = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 shadow-sm',
  accent: 'bg-accent-500 text-primary-950 hover:bg-accent-400 active:bg-accent-600 shadow-sm',
  secondary:
    'bg-surface text-primary-800 ring-1 ring-inset ring-line-strong hover:bg-primary-50 hover:ring-primary-300',
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-dark shadow-sm',
  ghost: 'text-primary-800 hover:bg-primary-50',
  inverse: 'bg-white text-primary-800 hover:bg-primary-50',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 shadow-sm',
}

// Every size keeps a touch target of at least 44px.
const SIZES = {
  sm: 'min-h-11 px-4 text-[0.95rem] gap-1.5',
  md: 'min-h-12 px-5 text-base gap-2',
  lg: 'min-h-14 px-5 sm:px-7 text-[1.0625rem] gap-2.5',
}

/**
 * One button for everything:
 *   <Button to="/book">          → internal link
 *   <Button href="tel:...">      → external / tel / wa.me link
 *   <Button onClick={...}>       → real <button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  to,
  href,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-control text-center font-semibold leading-tight',
    'transition-[background-color,box-shadow,transform,color] duration-200 ease-out active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  )
  const iconSize = size === 'lg' ? 22 : 20
  const content = (
    <>
      {icon && <Icon name={icon} size={iconSize} className="shrink-0" />}
      {children && <span className="min-w-0">{children}</span>}
      {iconRight && (
        <Icon
          name={iconRight}
          size={iconSize}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cn('group', classes)} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    const external = /^https?:/.test(href)
    return (
      <a
        href={href}
        className={cn('group', classes)}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {content}
      </a>
    )
  }
  return (
    <button type={type} className={cn('group', classes)} {...rest}>
      {content}
    </button>
  )
}
