import { useState } from 'react';
import { router } from '@inertiajs/react';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { Button } from '@/Components/UI/Button';
import { Badge } from '@/Components/UI/Badge';
import { Img } from '@/Components/UI/Img';
import { cn } from '@/lib/format';
import { portfolioPhoto, PORTFOLIO_FALLBACK } from '@/lib/image';
import type { PortfolioItemRow } from '@/types';
import type { DataTablePaginationLinks, DataTablePaginationMeta } from '@/Components/Admin/DataTable';

/*
|--------------------------------------------------------------------------
| PortfolioItemsTable
|--------------------------------------------------------------------------
| The works table shared by the admin and the master panel. The only
| difference between the two is the "Мастер" column, which the master panel
| omits (every row is his own) — hence `showMaster`.
|
| Toggling publication is a PATCH to the panel's own toggle endpoint, and the
| delete button opens a ConfirmDialog before the DELETE goes out.
*/

export interface PortfolioItemsTableProps {
    items: PortfolioItemRow[];
    meta?: DataTablePaginationMeta;
    links?: DataTablePaginationLinks;
    /** Admin panel only: adds the master column. */
    showMaster?: boolean;
    /** Panel-specific URLs. */
    editHref: (item: PortfolioItemRow) => string;
    destroyUrl: (item: PortfolioItemRow) => string;
    toggleUrl: (item: PortfolioItemRow) => string;
}

export function PortfolioItemsTable({
    items,
    meta,
    links,
    showMaster = false,
    editHref,
    destroyUrl,
    toggleUrl,
}: PortfolioItemsTableProps) {
    const [deleting, setDeleting] = useState<PortfolioItemRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [toggling, setToggling] = useState<number | null>(null);

    const confirmDelete = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        router.delete(destroyUrl(deleting), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const toggle = (item: PortfolioItemRow): void => {
        setToggling(item.id);

        router.patch(
            toggleUrl(item),
            {},
            {
                preserveScroll: true,
                onFinish: () => setToggling(null),
            },
        );
    };

    const columns: Array<DataTableColumn<PortfolioItemRow>> = [
        {
            key: 'photo',
            header: '',
            className: 'w-16',
            render: (item) => (
                <span className="block h-10 w-10 overflow-hidden rounded-xl border border-border bg-bg-secondary">
                    <Img
                        src={portfolioPhoto(item.photo_path)}
                        fallbackSrc={PORTFOLIO_FALLBACK}
                        alt=""
                        width={40}
                        height={40}
                    />
                </span>
            ),
        },
        {
            key: 'title',
            header: 'Работа',
            sortable: true,
            accessor: (item) => item.title,
            render: (item) => (
                <span className="block min-w-0">
                    <span className="block truncate font-medium text-text-primary">
                        {item.title ?? 'Без названия'}
                    </span>
                    {item.description !== null && item.description !== '' && (
                        <span className="block max-w-md truncate text-xs text-text-secondary">
                            {item.description}
                        </span>
                    )}
                </span>
            ),
        },
    ];

    if (showMaster) {
        columns.push({
            key: 'master',
            header: 'Мастер',
            sortable: true,
            accessor: (item) => item.master?.user?.name ?? item.master?.name,
            render: (item) => (
                <span className="whitespace-nowrap text-text-secondary">
                    {item.master?.user?.name ?? item.master?.name ?? '—'}
                </span>
            ),
        });
    }

    columns.push(
        {
            key: 'sort_order',
            header: 'Порядок',
            sortable: true,
            align: 'right',
            accessor: (item) => item.sort_order,
            render: (item) => <span className="tabular-nums">{item.sort_order}</span>,
        },
        {
            key: 'is_published',
            header: 'Статус',
            sortable: true,
            accessor: (item) => (item.is_published ? 1 : 0),
            render: (item) => (
                <button
                    type="button"
                    onClick={() => toggle(item)}
                    disabled={toggling === item.id}
                    aria-pressed={item.is_published}
                    title={
                        item.is_published
                            ? 'Скрыть работу с сайта'
                            : 'Опубликовать работу на сайте'
                    }
                    className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all duration-300',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        toggling === item.id && 'opacity-60',
                        item.is_published
                            ? 'border-success/40 bg-success/10 text-success hover:border-success'
                            : 'border-border bg-bg-secondary text-text-secondary hover:border-accent hover:text-accent',
                    )}
                >
                    <Badge tone={item.is_published ? 'emerald' : 'neutral'} dot>
                        {item.is_published ? 'Опубликовано' : 'Черновик'}
                    </Badge>
                </button>
            ),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (item) => (
                <div className="flex items-center justify-end gap-2">
                    <Button href={editHref(item)} variant="ghost" size="sm">
                        Изменить
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(item)}
                        className="border-danger/50 text-danger hover:border-danger hover:text-danger"
                    >
                        Удалить
                    </Button>
                </div>
            ),
        },
    );

    return (
        <>
            <DataTable
                caption="Работы в портфолио"
                columns={columns}
                rows={items}
                rowKey={(item) => item.id}
                meta={meta}
                links={links}
                empty="Работ пока нет — добавьте первую."
            />

            <ConfirmDialog
                open={deleting !== null}
                title="Удалить работу?"
                message={
                    deleting === null ? null : (
                        <>
                            Работа{' '}
                            <span className="text-text-primary">
                                «{deleting.title ?? 'Без названия'}»
                            </span>{' '}
                            будет удалена из портфолио вместе с загруженным файлом. Действие
                            необратимо.
                        </>
                    )
                }
                confirmLabel="Удалить работу"
                processing={processing}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

export default PortfolioItemsTable;
