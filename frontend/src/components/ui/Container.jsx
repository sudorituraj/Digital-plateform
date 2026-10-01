import { cn } from '../../lib/cn'

/** Centred page-width wrapper with a 16px gutter on phones. */
export function Container({ as: Tag = 'div', size = 'default', className, children, ...rest }) {
  const widths = { narrow: 'max-w-3xl', default: 'max-w-6xl', wide: 'max-w-7xl' }
  return (
    <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[size], className)} {...rest}>
      {children}
    </Tag>
  )
}
