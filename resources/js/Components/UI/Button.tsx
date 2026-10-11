import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Button
|--------------------------------------------------------------------------
| Design system: `rounded-full px-6 py-3`, primary = accent background with
| black text, ghost = border with light text, all with a 300ms transition and
| a visible focus ring.
|
| When `href` is given the component renders an Inertia <Link> (SPA visit)
| instead of a <button>, keeping one visual definition for both.
*/

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
    primary:
        'bg-accent text-bg-primary hover:bg-accent-hover focus-visible:ring-accent',
    ghost:
        'border border-border bg-transparent text-text-primary hover:border-accent hover:text-accent',
    danger:
        'bg-danger text-white hover:bg-danger/85 focus-visible:ring-danger',
    subtle:
        'bg-bg-elevated text-text-primary hover:bg-border focus-visible:ring-accent',
};

const SIZES: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
};

const BASE =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide ' +
    'transition-all duration-300 focus:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ' +
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Renders an Inertia link instead of a button. */
    href?: string;
    /** Replaces the label with a spinner and blocks interaction. */
    loading?: boolean;
    fullWidth?: boolean;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            variant = 'primary',
            size = 'md',
            href,
            loading = false,
            fullWidth = false,
            iconLeft,
            iconRight,
            className,
            children,
            type = 'button',
            disabled,
            ...props
        },
        ref,
    ) {
        const classes = cn(
            BASE,
            VARIANTS[variant],
            SIZES[size],
            fullWidth && 'w-full',
            className,
        );

        const content = (
            <>
                {loading ? (
                    <Spinner />
                ) : (
                    iconLeft !== undefined && (
                        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                            {iconLeft}
                        </span>
                    )
                )}
                <span>{children}</span>
                {iconRight !== undefined && !loading && (
                    <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                        {iconRight}
                    </span>
                )}
            </>
        );

        if (href !== undefined && !disabled && !loading) {
            return (
                <Link href={href} className={classes} {...(props as object)}>
                    {content}
                </Link>
            );
        }

        return (
            <button
                ref={ref}
                type={type}
                className={classes}
                disabled={disabled === true || loading}
                aria-busy={loading || undefined}
                {...props}
            >
                {content}
            </button>
        );
    },
);

/** Small inline spinner shown while `loading` is true. */
export function Spinner({ className }: { className?: string }) {
    return (
        <svg
            className={cn('h-4 w-4 animate-spin', className)}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.5"
                className="opacity-25"
            />
            <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}
