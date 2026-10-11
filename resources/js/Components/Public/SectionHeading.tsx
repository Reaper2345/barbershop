import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| SectionHeading
|--------------------------------------------------------------------------
| The eyebrow → title → subtitle stack used at the top of every public
| section. Centralised so the vertical rhythm and type scale stay identical
| across the home, masters and services pages.
*/

export interface SectionHeadingProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Trailing action, aligned right on wide screens. */
    action?: ReactNode;
    align?: 'left' | 'center';
    /** id applied to the <h2>, so the section can reference it with aria-labelledby. */
    id?: string;
    className?: string;
}

export function SectionHeading({
    eyebrow,
    title,
    subtitle,
    action,
    align = 'left',
    id,
    className,
}: SectionHeadingProps) {
    const centered = align === 'center';

    return (
        <div
            className={cn(
                'flex flex-col gap-6',
                !centered && action !== undefined && 'md:flex-row md:items-end md:justify-between',
                className,
            )}
        >
            <div className={cn(centered && 'mx-auto text-center')}>
                {eyebrow !== undefined && (
                    <p className="section-eyebrow">{eyebrow}</p>
                )}

                <h2 id={id} className={cn('section-title', eyebrow !== undefined && 'mt-3')}>
                    {title}
                </h2>

                {subtitle !== undefined && (
                    <p className={cn('section-subtitle', centered && 'mx-auto')}>{subtitle}</p>
                )}
            </div>

            {action !== undefined && (
                <div className={cn('shrink-0', centered && 'mx-auto')}>{action}</div>
            )}
        </div>
    );
}

export default SectionHeading;
