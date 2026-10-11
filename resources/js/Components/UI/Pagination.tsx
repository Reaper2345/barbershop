import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import { cn } from '@/lib/format';
import { isPaginated, type Paginated } from '@/types';

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
| Renders a Laravel paginator (as returned by MasterController@show for the
| review list) using `links` directly, so page numbering, query strings and
| the "…" separators always match the backend. Accepts a plain array too, in
| which case nothing is rendered — that keeps call sites free of null checks.
*/

export interface PaginationProps<T> {
    /** The paginator, or a plain array when the collection is not paged. */
    paginator: Paginated<T> | T[];
    /** Show the "1–10 из 42" summary. */
    showSummary?: boolean;
    className?: string;
}

export function Pagination<T>({
    paginator,
    showSummary = true,
    className,
}: PaginationProps<T>) {
    if (!isPaginated(paginator) || paginator.last_page <= 1) {
        return null;
    }

    const { links, current_page: currentPage, last_page: lastPage, from, to, total } = paginator;

    // Laravel wraps the first/last entries in « » entities.
    const firstLink = links[0];
    const lastLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    return (
        <nav
            aria-label="Навигация по страницам"
            className={cn('flex flex-col items-center gap-4 sm:flex-row sm:justify-between', className)}
        >
            {showSummary && (
                <p className="text-sm text-text-secondary" aria-live="polite">
                    {from !== null && to !== null
                        ? `Показано ${from}–${to} из ${total}`
                        : `Всего ${total}`}
                </p>
            )}

            <div className="flex items-center gap-1">
                <PageControl
                    href={firstLink?.url ?? null}
                    disabled={currentPage <= 1}
                    ariaLabel="Предыдущая страница"
                    rel="prev"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </PageControl>

                {pageLinks.map((link, index) => {
                    const label = decodeLabel(link.label);
                    const isEllipsis = label === '...';

                    if (isEllipsis) {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-sm text-text-secondary"
                                aria-hidden="true"
                            >
                                …
                            </span>
                        );
                    }

                    return (
                        <PageControl
                            key={`page-${label}`}
                            href={link.url}
                            active={link.active}
                            disabled={link.url === null}
                            ariaLabel={`Страница ${label}`}
                            ariaCurrent={link.active ? 'page' : undefined}
                        >
                            {label}
                        </PageControl>
                    );
                })}

                <PageControl
                    href={lastLink?.url ?? null}
                    disabled={currentPage >= lastPage}
                    ariaLabel="Следующая страница"
                    rel="next"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </PageControl>
            </div>
        </nav>
    );
}

function PageControl({
    href,
    active = false,
    disabled = false,
    ariaLabel,
    ariaCurrent,
    rel,
    children,
}: {
    href: string | null;
    active?: boolean;
    disabled?: boolean;
    ariaLabel: string;
    ariaCurrent?: 'page';
    rel?: 'prev' | 'next';
    children: ReactNode;
}) {
    const classes = cn(
        'inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm',
        'transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
            ? 'border-accent bg-accent font-semibold text-bg-primary'
            : 'border-border text-text-secondary hover:border-accent hover:text-accent',
        disabled && 'pointer-events-none opacity-40',
    );

    // Disabled entries keep their box (so the row never jumps) but lose their
    // link semantics entirely.
    if (href === null || disabled) {
        return (
            <span className={classes} aria-disabled="true" aria-label={ariaLabel}>
                {children}
            </span>
        );
    }

    return (
        <Link
            href={href}
            className={classes}
            aria-label={ariaLabel}
            aria-current={ariaCurrent}
            rel={rel}
            preserveScroll
        >
            {children}
        </Link>
    );
}

/** Laravel ships "&laquo; Previous" / "Next &raquo;" labels. */
function decodeLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .trim();
}

export default Pagination;
