import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Input
|--------------------------------------------------------------------------
| Dark field with a shared label/hint/error contract. Accessibility details:
|   - the label is bound with htmlFor/id (id is generated when omitted),
|   - errors are announced through aria-describedby + aria-invalid,
|   - the error text carries role="alert" so it is read when it appears.
*/

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
    id?: string;
    label?: string;
    /** Validation message; also switches the field to its error styling. */
    error?: string;
    hint?: string;
    iconLeft?: ReactNode;
    rightSlot?: ReactNode;
    containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        id,
        label,
        error,
        hint,
        iconLeft,
        rightSlot,
        className,
        containerClassName,
        required,
        ...props
    },
    ref,
) {
    const generatedId = useId();
    const inputId = id ?? `input-${generatedId.replace(/:/g, '')}`;
    const describedBy = error !== undefined ? `${inputId}-error` : hint !== undefined ? `${inputId}-hint` : undefined;

    return (
        <div className={cn('w-full', containerClassName)}>
            {label !== undefined && (
                <label
                    htmlFor={inputId}
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
                {iconLeft !== undefined && (
                    <span
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary [&>svg]:h-5 [&>svg]:w-5"
                        aria-hidden="true"
                    >
                        {iconLeft}
                    </span>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    required={required}
                    aria-invalid={error !== undefined || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        'w-full rounded-xl border bg-bg-secondary px-4 py-3 text-sm text-text-primary',
                        'placeholder:text-text-secondary/60 transition-all duration-300',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        error !== undefined
                            ? 'border-danger focus-visible:ring-danger'
                            : 'border-border focus-visible:border-accent focus-visible:ring-accent/60',
                        iconLeft !== undefined && 'pl-11',
                        rightSlot !== undefined && 'pr-11',
                        className,
                    )}
                    {...props}
                />

                {rightSlot !== undefined && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
                )}
            </div>

            <FieldMessage id={`${inputId}-hint`} error={error} hint={hint} errorId={`${inputId}-error`} />
        </div>
    );
});

/**
 * Shared hint/error line for Input, Textarea and Select so the three fields
 * always render validation identically.
 */
export function FieldMessage({
    error,
    hint,
    id,
    errorId,
}: {
    error?: string;
    hint?: string;
    id: string;
    errorId: string;
}) {
    if (error !== undefined) {
        return (
            <p
                id={errorId}
                role="alert"
                className="mt-2 flex items-center gap-1.5 text-xs text-danger"
            >
                <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                {error}
            </p>
        );
    }

    if (hint !== undefined) {
        return (
            <p id={id} className="mt-2 text-xs text-text-secondary">
                {hint}
            </p>
        );
    }

    return null;
}

export default Input;
