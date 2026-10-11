import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| Card
|--------------------------------------------------------------------------
| Design system: `bg-elevated border border-border rounded-2xl p-6`.
| Sub-components (CardHeader / CardTitle / CardBody / CardFooter) exist so
| pages do not re-invent spacing inside the same surface.
|
| `as` is a discriminated prop: the attribute type follows the element, so
| `<Card as="li">` is typed as an <li> rather than a <div>.
*/

interface CardBaseProps {
    /** `none` for image-only cards that must reach the rounded edge. */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Lifts the border and adds a shadow on hover — used for clickable cards. */
    interactive?: boolean;
    /** Rendered element; the attribute type follows the common HTML subset. */
    as?: 'div' | 'article' | 'section' | 'li';
}

export type CardProps = CardBaseProps & Omit<HTMLAttributes<HTMLDivElement>, 'as'>;

const PADDING = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
} as const;

export function Card({
    padding = 'md',
    interactive = false,
    className,
    children,
    as: Tag = 'div',
    ...props
}: CardProps) {
    // The polymorphic `as` prop narrows the element tag, but the shared
    // attribute bag is typed as the common <div> subset, so the spread needs
    // one explicit escape hatch. This is the standard polymorphic-component
    // trade-off; the public prop type stays strict.
    const Tagged = Tag as keyof JSX.IntrinsicElements;

    return (
        <Tagged
            className={cn(
                'rounded-2xl border border-border bg-bg-elevated transition-all duration-300',
                PADDING[padding],
                interactive && 'hover:border-accent/60 hover:shadow-lg hover:shadow-black/40',
                className,
            )}
            {...(props as Record<string, unknown>)}
        >
            {children}
        </Tagged>
    );
}

export function CardHeader({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('mb-4 flex items-start justify-between gap-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn('font-display text-xl font-semibold text-text-primary', className)}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn('mt-1 text-sm text-text-secondary', className)} {...props}>
            {children}
        </p>
    );
}

export function CardBody({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('text-sm leading-relaxed text-text-secondary', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
    return (
        <div
            className={cn('mt-6 flex items-center justify-between gap-4 border-t border-border pt-4', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;
