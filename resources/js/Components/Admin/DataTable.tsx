import { useState, type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDownIcon, ChevronUpIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| DataTable
|--------------------------------------------------------------------------
| The admin panel's workhorse: a sortable, paginated table.
|
| Two ways to page:
|   - server: pass `meta` + `links` from the controller's `*_meta`/`*_links`
|     props (Laravel paginator). Sorting re-requests with ?sort=&dir=.
|   - client: pass only `rows`; sorting and paging happen in memory.
|
| Accessibility: real <table> semantics, `aria-sort` on the sorted column,
| scope="col" headers, and a caption that is visually hidden but announced.
*/

export interface DataTableColumn<T> {
    /** Stable key; also the default accessor when `accessor` is absent. */
    key: string;
    header: string;
    /** Cell renderer. */
    render?: (row: T, index: number) => ReactNode;
    /** Value used by the sort comparator and the CSV-ish fallback renderer. */
    accessor?: (row: T) => string | number | null | undefined;
    sortable?: boolean;
    align?: 'left' | 'right' | 'center';
    /** Tailwind classes for the column (width, whitespace, hidden on mobile). */
    className?: string;
    /** Header classes, e.g. "hidden md:table-cell". */
    headerClassName?: string;
}

export interface DataTablePaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface DataTablePaginationLinks {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
}

export interface DataTableProps<T> {
    columns: Array<DataTableColumn<T>>;
    rows: T[];
    /** Stable row key. */
    rowKey: (row: T, index: number) => string | number;
    /** Announced table caption. */
    caption: string;
    /** Empty-state content. */
    empty?: ReactNode;
    /** Server paginator meta, when the data is paged server-side. */
    meta?: DataTablePaginationMeta;
    /** Server paginator links, when the data is paged server-side. */
    links?: DataTablePaginationLinks;
    /** Current sort state (server mode). */
    sort?: string | null;
    direction?: 'asc' | 'desc';
    /** Server mode: called with the new sort column. */
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
    /** Client mode: rows per page. */
    perPage?: number;
    /** Row click handler, e.g. opening a detail modal. */
    onRowClick?: (row: T) => void;
    className?: string;
}

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    caption,
    empty,
    meta,
    links,
    sort = null,
    direction = 'desc',
    onSort,
    perPage = 15,
    onRowClick,
    className,
}: DataTableProps<T>) {
    const serverPaged = meta !== undefined;

    // Client-side sort/page state. In server mode these stay unused and the
    // authoritative values come from the paginator props.
    const [clientSort, setClientSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [page, setPage] = useState(1);

    const activeSort = serverPaged ? sort : clientSort?.key ?? null;
    const activeDir = serverPaged ? direction : clientSort?.dir ?? 'desc';

    /** Client-mode sort + slice. */
    const visibleRows = (() => {
        if (serverPaged) {
            return rows;
        }

        if (clientSort === null) {
            return rows.slice((page - 1) * perPage, page * perPage);
        }

        const column = columns.find((candidate) => candidate.key === clientSort.key);
        const accessor = column?.accessor;

        if (accessor === undefined) {
            return rows.slice((page - 1) * perPage, page * perPage);
        }

        const sorted = [...rows].sort((a, b) => {
            const left = accessor(a);
            const right = accessor(b);

            if (left === right) {
                return 0;
            }

            if (left === null || left === undefined) {
                return 1;
            }

            if (right === null || right === undefined) {
                return -1;
            }

            const comparison =
                typeof left === 'number' && typeof right === 'number'
                    ? left - right
                    : String(left).localeCompare(String(right), 'ru');

            return clientSort.dir === 'asc' ? comparison : -comparison;
        });

        return sorted.slice((page - 1) * perPage, page * perPage);
    })();

    const clientPageCount = Math.max(1, Math.ceil(rows.length / perPage));
    const currentPage = serverPaged ? meta.current_page : page;
    const pageCount = serverPaged ? meta.last_page : clientPageCount;
    const total = serverPaged ? meta.total : rows.length;

    const handleSort = (column: DataTableColumn<T>): void => {
        if (column.sortable !== true) {
            return;
        }

        const nextDir: 'asc' | 'desc' =
            activeSort === column.key && activeDir === 'asc' ? 'desc' : 'asc';

        if (serverPaged) {
            onSort?.(column.key, nextDir);

            return;
        }

        setClientSort({ key: column.key, dir: nextDir });
        setPage(1);
    };

    const align = (value: DataTableColumn<T>['align']): string =>
        value === 'right' ? 'text-right' : value === 'center' ? 'text-center' : 'text-left';

    return (
        <div className={cn('overflow-hidden rounded-2xl border border-border bg-bg-elevated', className)}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                    <caption className="sr-only">{caption}</caption>

                    <thead>
                        <tr className="border-b border-border bg-bg-secondary">
                            {columns.map((column) => {
                                const sorted = activeSort === column.key;

                                return (
                                    <th
                                        key={column.key}
                                        scope="col"
                                        aria-sort={
                                            sorted
                                                ? activeDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : column.sortable === true
                                                  ? 'none'
                                                  : undefined
                                        }
                                        className={cn(
                                            'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary',
                                            align(column.align),
                                            column.headerClassName,
                                        )}
                                    >
                                        {column.sortable === true ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSort(column)}
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 transition-all duration-300 hover:text-accent',
                                                    'focus-visible:ring-2 focus-visible:ring-accent',
                                                    sorted && 'text-accent',
                                                )}
                                            >
                                                {column.header}
                                                {sorted ? (
                                                    activeDir === 'asc' ? (
                                                        <ChevronUpIcon className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-3.5 w-3.5" />
                                                    )
                                                ) : (
                                                    <span className="text-border" aria-hidden="true">
                                                        ↕
                                                    </span>
                                                )}
                                            </button>
                                        ) : (
                                            column.header
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-10 text-center text-text-secondary">
                                    {empty ?? 'Нет данных'}
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((row, index) => (
                                <tr
                                    key={rowKey(row, index)}
                                    onClick={onRowClick !== undefined ? () => onRowClick(row) : undefined}
                                    className={cn(
                                        'border-b border-border/60 last:border-b-0 transition-colors duration-200',
                                        onRowClick !== undefined && 'cursor-pointer hover:bg-bg-secondary',
                                    )}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={cn(
                                                'px-4 py-3 align-middle text-text-primary',
                                                align(column.align),
                                                column.className,
                                            )}
                                        >
                                            {column.render !== undefined
                                                ? column.render(row, index)
                                                : formatCell(column.accessor?.(row))}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col gap-4 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-text-secondary" aria-live="polite">
                    {total === 0
                        ? 'Записей нет'
                        : `Показано ${serverPaged ? (meta.from ?? 0) : (currentPage - 1) * perPage + 1}–${
                              serverPaged
                                  ? (meta.to ?? 0)
                                  : Math.min(currentPage * perPage, total)
                          } из ${total}`}
                </p>

                {pageCount > 1 && (
                    <nav aria-label="Навигация по таблице" className="flex items-center gap-2">
                        <PagerButton
                            label="Предыдущая страница"
                            disabled={currentPage <= 1}
                            href={serverPaged ? (links?.prev ?? null) : null}
                            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                            serverPaged={serverPaged}
                        />

                        <span className="px-2 text-xs text-text-secondary">
                            {currentPage} / {pageCount}
                        </span>

                        <PagerButton
                            label="Следующая страница"
                            disabled={currentPage >= pageCount}
                            href={serverPaged ? (links?.next ?? null) : null}
                            onClick={() => setPage((previous) => Math.min(pageCount, previous + 1))}
                            serverPaged={serverPaged}
                        />
                    </nav>
                )}
            </div>
        </div>
    );
}

/** Server mode follows the paginator URL; client mode updates local state. */
function PagerButton({
    label,
    disabled,
    href,
    onClick,
    serverPaged,
}: {
    label: string;
    disabled: boolean;
    href: string | null;
    onClick: () => void;
    serverPaged: boolean;
}) {
    const classes = cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border px-3 text-xs',
        'text-text-secondary transition-all duration-300 hover:border-accent hover:text-accent',
        'focus-visible:ring-2 focus-visible:ring-accent',
        disabled && 'pointer-events-none opacity-40',
    );

    if (serverPaged) {
        if (href === null || disabled) {
            return (
                <span className={classes} aria-disabled="true" aria-label={label}>
                    {label.startsWith('Пред') ? '←' : '→'}
                </span>
            );
        }

        return (
            <Link href={href} className={classes} aria-label={label} preserveScroll>
                {label.startsWith('Пред') ? '←' : '→'}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={classes}>
            {label.startsWith('Пред') ? '←' : '→'}
        </button>
    );
}

/** Fallback cell renderer for columns without an explicit `render`. */
function formatCell(value: string | number | null | undefined): ReactNode {
    if (value === null || value === undefined || value === '') {
        return <span className="text-text-secondary">—</span>;
    }

    return String(value);
}

export default DataTable;
