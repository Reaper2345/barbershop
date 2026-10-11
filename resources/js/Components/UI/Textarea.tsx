import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { FieldMessage } from './Input';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Textarea
|--------------------------------------------------------------------------
| Same label/hint/error contract as Input, sharing FieldMessage so validation
| output is identical across the form kit.
*/

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
    id?: string;
    label?: string;
    error?: string;
    hint?: string;
    containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { id, label, error, hint, className, containerClassName, required, rows = 4, ...props },
    ref,
) {
    const generatedId = useId();
    const textareaId = id ?? `textarea-${generatedId.replace(/:/g, '')}`;
    const describedBy =
        error !== undefined
            ? `${textareaId}-error`
            : hint !== undefined
              ? `${textareaId}-hint`
              : undefined;

    return (
        <div className={cn('w-full', containerClassName)}>
            {label !== undefined && (
                <label
                    htmlFor={textareaId}
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

            <textarea
                ref={ref}
                id={textareaId}
                rows={rows}
                required={required}
                aria-invalid={error !== undefined || undefined}
                aria-describedby={describedBy}
                className={cn(
                    'w-full resize-y rounded-xl border bg-bg-secondary px-4 py-3 text-sm text-text-primary',
                    'placeholder:text-text-secondary/60 transition-all duration-300',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    error !== undefined
                        ? 'border-danger focus-visible:ring-danger'
                        : 'border-border focus-visible:border-accent focus-visible:ring-accent/60',
                    className,
                )}
                {...props}
            />

            <FieldMessage
                id={`${textareaId}-hint`}
                errorId={`${textareaId}-error`}
                error={error}
                hint={hint}
            />
        </div>
    );
});

export default Textarea;
