import { useId } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

const controlBase =
  'block w-full rounded-control border bg-surface px-4 text-base text-ink placeholder:text-ink-subtle ' +
  'transition-[border-color,box-shadow] duration-150 outline-none ' +
  'focus:border-primary-500 focus:ring-4 focus:ring-primary-100 ' +
  'disabled:cursor-not-allowed disabled:bg-sunken'

const controlState = (error) =>
  error ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-50' : 'border-line-strong'

/**
 * Wraps any control with a label, hint and error message, wired up for screen readers.
 * Children receive the ids via a render function: {(ids) => <input id={ids.id} ... />}
 */
export function Field({ id: idProp, label, hint, error, optional = false, className, children }) {
  const { t } = useI18n()
  const autoId = useId()
  const id = idProp ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-ink-muted">({t('form.optional')})</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-danger-700" role="alert">
          <Icon name="alertCircle" size={16} />
          {error}
        </p>
      )}
    </div>
  )
}

export function TextField({ id, label, hint, error, optional, className, ...inputProps }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={!optional}
          className={cn(controlBase, controlState(error), 'min-h-13')}
          {...inputProps}
        />
      )}
    </Field>
  )
}

/** Indian mobile number input: fixed +91 prefix, numeric keypad, digits only. */
export function PhoneField({ label, hint, error, value, onChange, className, ...inputProps }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="flex">
          <span className="inline-flex items-center rounded-l-control border border-r-0 border-line-strong bg-sunken px-3.5 font-semibold text-ink-muted">
            +91
          </span>
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            required
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            value={value}
            onChange={(e) => onChange?.(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={cn(controlBase, controlState(error), 'min-h-13 rounded-l-none tracking-wider')}
            {...inputProps}
          />
        </div>
      )}
    </Field>
  )
}

export function TextareaField({ id, label, hint, error, optional, className, rows = 3, ...inputProps }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={!optional}
          className={cn(controlBase, controlState(error), 'resize-y py-3')}
          {...inputProps}
        />
      )}
    </Field>
  )
}

export function SelectField({ label, hint, error, optional, options, className, ...selectProps }) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={!optional}
            className={cn(controlBase, controlState(error), 'min-h-13 appearance-none pr-11')}
            {...selectProps}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-muted"
          />
        </div>
      )}
    </Field>
  )
}

/**
 * Large tappable options (radio group) — less typing than a dropdown.
 * Used for gender, preferred time, etc.
 */
export function ChoiceChips({ legend, name, options, value, onChange, error, columns, className }) {
  const errorId = useId()
  return (
    <fieldset className={cn('space-y-2', className)} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 font-semibold text-ink">{legend}</legend>
      <div className={columns ? 'grid gap-2' : 'flex flex-wrap gap-2.5'} style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
        {options.map((o) => {
          const checked = value === o.value
          return (
            <label
              key={o.value}
              className={cn(
                'press relative inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-control border px-4 font-medium',
                columns && 'min-h-16 flex-col justify-center gap-1 px-2 text-center text-[0.95rem] leading-tight',
                'transition-colors duration-150 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-400',
                checked
                  ? 'animate-[pop_0.3s_var(--ease-gentle)] border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-line-strong bg-surface text-ink hover:border-primary-300',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange?.(o.value)}
                className="sr-only"
              />
              {o.icon && <Icon name={o.icon} size={18} />}
              {o.label}
              {checked && !columns && <Icon name="check" size={18} className="text-primary-700" />}
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
