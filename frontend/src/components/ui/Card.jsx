import { cn } from '../../lib/cn'

// Background/border/shadow per tone. Pick a tone rather than overriding bg-* in className
// (utility order means an override may silently lose).
const TONES = {
  default: 'border border-line bg-surface shadow-card',
  muted: 'border border-line bg-sunken/60',
  brand: 'bg-primary-800 text-white',
}

/**
 * Surface container. Use `interactive` for cards that are clickable/hoverable.
 * `as` lets a card be an <article>, <li>, <section>, etc.
 */
export function Card({ as: Tag = 'div', tone = 'default', interactive = false, padding = 'md', className, children, ...rest }) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' }
  return (
    <Tag
      className={cn(
        'rounded-card',
        TONES[tone],
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-300 ease-(--ease-gentle) hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-raised',
        paddings[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
