import { useReveal } from '../../hooks/useReveal'
import { cn } from '../../lib/cn'

/** Wrap a block to fade it in when scrolled into view. `delay` in ms for simple staggering. */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  const [ref, visible] = useReveal()
  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
