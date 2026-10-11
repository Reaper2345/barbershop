import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { FieldMessage } from './Input';
import { ChevronDownIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Select
|--------------------------------------------------------------------------
| A native <select> (keyboard and mobile behaviour come for free) restyled for
| the dark theme, with the same label/hint/error contract as the other fields.
*/

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
    id?: string;
    label?: string;
    error?: string;
    hint?: string;
    options: SelectOption[];
    /** Rendered as a disabled first entry, e.g. "Все категории". */
    placeholder?: string;
    containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { id, label, error, hint, options, placeholder, className, containerClassName, required, ...props },
    ref,
) {
    const generatedId = useId();
    const selectId = id ?? `select-${generatedId.replace(/:/g, '')}`;
    const describedBy =
        error !== undefined
            ? `${selectId}-error`
            : hint !== undefined
              ? `${selectId}-hint`
              : undefined;

    return (
        <div className={cn('w-full', containerClassName)}>
            {label !== undefined && (
                <label
                    htmlFor={selectId}
                    className="mb-2 block text-sm font-medium text-text-primary"
                >
                    {label}
                    {required === true && (
                        <span className="ml-1 text-accent" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    required={required}
                    aria-invalid={error !== undefined || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        'w-full appearance-none rounded-xl border bg-bg-secondary px-4 py-3 pr-11 text-sm text-text-primary',
                        'transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        error !== undefined
                            ? 'border-danger focus-visible:ring-danger'
                            : 'border-border focus-visible:border-accent focus-visible:ring-accent/60',
                        className,
                    )}
                    {...props}
                >
                    {placeholder !== undefined && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}

                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled === true}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDownIcon
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                    aria-hidden="true"
                />
            </div>

            <FieldMessage
                id={`${selectId}-hint`}
                errorId={`${selectId}-error`}
                error={error}
                hint={hint}
            />
        </div>
    );
});

export default Select;
