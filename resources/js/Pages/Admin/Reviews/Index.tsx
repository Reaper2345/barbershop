import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { Button } from '@/Components/UI/Button';
import { Badge } from '@/Components/UI/Badge';
import { Modal } from '@/Components/UI/Modal';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { RatingStars } from '@/Components/UI/RatingStars';
import { EmptyState } from '@/Components/UI/EmptyState';
import { QuoteIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/format';
import type { AdminReviewRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Reviews/Index — GET /admin/reviews
|--------------------------------------------------------------------------
| Moderation queue. Approving publishes the review AND recalculates the
| master's cached rating (Admin\ReviewController@approve); deleting an approved
| review recalculates it again. Un-approving is the inverse of approve and is
| handled by the same recalculating path (see Admin\ReviewController).
|
| Filter: `?approved=no` shows only the pending queue.
*/

export interface AdminReviewsIndexProps {
    reviews?: AdminReviewRow[];
    reviews_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    reviews_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
    filters?: { approved?: string };
}

type FilterId = 'all' | 'yes' | 'no';

const FILTERS: Array<{ id: FilterId; label: string }> = [
    { id: 'all', label: 'Все отзывы' },
    { id: 'no', label: 'На модерации' },
    { id: 'yes', label: 'Опубликованные' },
];

export default function AdminReviewsIndex({
    reviews = [],
    reviews_meta,
    reviews_links,
    filters,
}: AdminReviewsIndexProps) {
    const [deleting, setDeleting] = useState<AdminReviewRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    /** Review opened in the "show full text" dialog. */
    const [expanded, setExpanded] = useState<AdminReviewRow | null>(null);

    /** Photo viewer, shared by the table cell and the detail dialog. */
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

    const current = (filters?.approved ?? '') as FilterId | '';
    const activeFilter: FilterId = current === 'yes' ? 'yes' : current === 'no' ? 'no' : 'all';

    const setApproved = (review: AdminReviewRow, approve: boolean): void => {
        setBusyId(review.id);

        const url = approve
            ? routes.admin.reviewApprove(review.id)
            : routes.admin.reviewUnapprove(review.id);

        router.patch(url, {}, {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    };

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        router.delete(routes.admin.review(deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const pendingCount = reviews.filter((review) => !review.is_approved).length;

    const columns: Array<DataTableColumn<AdminReviewRow>> = [
        {
            key: 'created_at',
            header: 'Дата',
            sortable: true,
            accessor: (row) => row.created_at,
            render: (row) => (
                <span className="whitespace-nowrap text-text-secondary">
                    {formatDate(row.created_at)}
                </span>
            ),
        },
        {
            key: 'client',
            header: 'Клиент',
            sortable: true,
            accessor: (row) => row.client?.name,
            render: (row) => <span className="text-text-primary">{row.client?.name ?? '—'}</span>,
        },
        {
            key: 'master',
            header: 'Мастер',
            sortable: true,
            accessor: (row) => masterLabel(row),
            render: (row) => (
                <span className="text-text-secondary">{masterLabel(row)}</span>
            ),
        },
        {
            key: 'rating',
            header: 'Оценка',
            sortable: true,
            accessor: (row) => row.rating,
            render: (row) => <RatingStars value={row.rating} size="sm" showValue={false} />,
        },
        {
            key: 'text',
            header: 'Отзыв',
            render: (row) => (
                <span className="block max-w-md">
                    <span className="line-clamp-2 text-text-secondary">
                        {row.text ?? <span className="italic">без текста</span>}
                    </span>
                    {row.appointment?.service?.name !== undefined && (
                        <span className="mt-1 block text-xs text-text-secondary/70">
                            {row.appointment.service.name}
                        </span>
                    )}
                    {/*
                     * The table clamps the body to two lines, which hides the end
                     * of every long review. The toggle opens a dialog with the
                     * full text plus the context a moderator needs to judge it:
                     * client, master, date and rating.
                     */}
                    {(row.text ?? '').length > 90 && (
                        <button
                            type="button"
                            onClick={() => setExpanded(row)}
                            aria-label={`Показать отзыв полностью (${row.client?.name ?? 'клиент'})`}
                            className="mt-1.5 text-xs font-medium text-accent underline underline-offset-4 transition-all duration-300 hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            Показать полностью
                        </button>
                    )}

                    {/* Client photo, when one was attached to the review. */}
                    {row.photo_url != null && row.photo_url !== '' && (
                        <button
                            type="button"
                            onClick={() =>
                                setLightbox({
                                    src: row.photo_url as string,
                                    alt: `Фото к отзыву — ${row.client?.name ?? 'клиент'}`,
                                    caption: row.client?.name ?? null,
                                })
                            }
                            aria-label="Открыть фото к отзыву"
                            className="mt-2 block w-fit cursor-pointer overflow-hidden rounded-lg border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <img
                                src={row.photo_url}
                                alt="Фото к отзыву"
                                loading="lazy"
                                className="h-16 w-auto object-cover"
                            />
                        </button>
                    )}
                </span>
            ),
        },
        {
            key: 'is_approved',
            header: 'Статус',
            sortable: true,
            accessor: (row) => (row.is_approved ? 1 : 0),
            render: (row) =>
                row.is_approved ? (
                    <Badge tone="emerald" dot>
                        Опубликован
                    </Badge>
                ) : (
                    <Badge tone="amber" dot>
                        На модерации
                    </Badge>
                ),
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    {row.is_approved ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            loading={busyId === row.id}
                            onClick={() => setApproved(row, false)}
                        >
                            Снять с публикации
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            loading={busyId === row.id}
                            onClick={() => setApproved(row, true)}
                        >
                            Опубликовать
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(row)}
                        className="border-danger/50 text-danger hover:border-danger hover:text-danger"
                    >
                        {PANEL.common.delete}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout
            title={PANEL.admin.reviewsTitle}
            subtitle="Модерация отзывов. Публикация влияет на рейтинг мастера на сайте."
            nav={buildAdminNav({ reviewsPending: pendingCount })}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Отзывы' },
            ]}
        >
            <Head title={PANEL.admin.reviewsTitle} />

            {/* Filters */}
            <div
                role="tablist"
                aria-label="Фильтр отзывов"
                className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {FILTERS.map((filter) => {
                    const selected = filter.id === activeFilter;

                    return (
                        <Link
                            key={filter.id}
                            href={routes.admin.reviews(filter.id === 'all' ? '' : filter.id)}
                            role="tab"
                            aria-selected={selected}
                            preserveScroll
                            className={cn(
                                'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-all duration-300',
                                'focus-visible:ring-2 focus-visible:ring-accent',
                                selected
                                    ? 'text-accent'
                                    : 'text-text-secondary hover:text-text-primary',
                            )}
                        >
                            {filter.label}

                            {selected && (
                                <span
                                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                                    aria-hidden="true"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>

            {reviews.length === 0 && activeFilter === 'no' ? (
                <EmptyState
                    size="sm"
                    icon={<QuoteIcon />}
                    title="Очередь модерации пуста"
                    description="Все отзывы проверены. Новые появятся здесь."
                    action={
                        <Button href={routes.admin.reviews()} variant="ghost">
                            Показать все отзывы
                        </Button>
                    }
                />
            ) : (
                <DataTable
                    caption={PANEL.admin.reviewsTitle}
                    columns={columns}
                    rows={reviews}
                    rowKey={(row) => row.id}
                    meta={reviews_meta}
                    links={reviews_links}
                    empty="Отзывов пока нет"
                />
            )}

            <ConfirmDialog
                open={deleting !== null}
                title="Удалить отзыв?"
                message={
                    deleting === null ? null : (
                        <>
                            Отзыв клиента{' '}
                            <span className="text-text-primary">{deleting.client?.name ?? '—'}</span>{' '}
                            будет удалён безвозвратно. Рейтинг мастера пересчитается.
                        </>
                    )
                }
                processing={processing}
                onConfirm={remove}
                onClose={() => setDeleting(null)}
            />

            {/*
             * Full-text dialog. Rendered from the page so it sits outside the
             * table's overflow container, and it carries the moderation actions
             * too — the decision is usually made while reading the whole text.
             */}
            <Modal
                open={expanded !== null}
                onClose={() => setExpanded(null)}
                size="lg"
                title="Отзыв полностью"
                description={
                    expanded === null
                        ? undefined
                        : `${expanded.client?.name ?? 'Клиент'} · ${masterLabel(expanded)} · ${formatDate(expanded.created_at)}`
                }
            >
                {expanded !== null && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <RatingStars value={expanded.rating} size="md" />

                            {expanded.is_approved ? (
                                <Badge tone="emerald" dot>
                                    Опубликован
                                </Badge>
                            ) : (
                                <Badge tone="amber" dot>
                                    На модерации
                                </Badge>
                            )}

                            {expanded.appointment?.service?.name !== undefined && (
                                <span className="text-xs text-text-secondary">
                                    Услуга: {expanded.appointment.service.name}
                                </span>
                            )}
                        </div>

                        <p className="whitespace-pre-line rounded-2xl border border-border bg-bg-secondary p-5 text-sm leading-relaxed text-text-primary">
                            {expanded.text ?? 'Текст отзыва не указан.'}
                        </p>

                        {expanded.photo_url != null && expanded.photo_url !== '' && (
                            <button
                                type="button"
                                onClick={() =>
                                    setLightbox({
                                        src: expanded.photo_url as string,
                                        alt: `Фото к отзыву — ${expanded.client?.name ?? 'клиент'}`,
                                        caption: expanded.client?.name ?? null,
                                    })
                                }
                                aria-label="Открыть фото к отзыву"
                                className="block w-fit cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                <img
                                    src={expanded.photo_url}
                                    alt="Фото к отзыву"
                                    className="h-56 w-auto object-cover"
                                />
                            </button>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row-reverse">
                            {expanded.is_approved ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setApproved(expanded, false);
                                        setExpanded(null);
                                    }}
                                >
                                    Снять с публикации
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setApproved(expanded, true);
                                        setExpanded(null);
                                    }}
                                >
                                    Опубликовать
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setExpanded(null)}
                            >
                                Закрыть
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Lightbox
                open={lightbox !== null}
                src={lightbox?.src ?? null}
                alt={lightbox?.alt ?? ''}
                caption={lightbox?.caption ?? null}
                onClose={() => setLightbox(null)}
            />
        </AdminLayout>
    );
}

/**
 * The review's master. The controller eager-loads `master.user`, but a review
 * can outlive nothing — `master` is always present. The fallback keeps the
 * column safe if a future query stops loading the relation.
 */
function masterLabel(review: AdminReviewRow): string {
    return review.master?.user?.name ?? review.master?.name ?? '—';
}
