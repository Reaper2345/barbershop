import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { Button } from '@/Components/UI/Button';
import { Badge } from '@/Components/UI/Badge';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { formatDuration, formatPriceRange } from '@/lib/format';
import type { AdminServiceRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Services/Index — GET /admin/services
|--------------------------------------------------------------------------
| The price catalogue. Deletion is refused by the controller when any booking
| references the service (appointments.service_id is ON DELETE RESTRICT), so
| the dialog points at "disable instead".
*/

export interface AdminServicesIndexProps {
    services?: AdminServiceRow[];
    services_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    services_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
}

export default function AdminServicesIndex({
    services = [],
    services_meta,
    services_links,
}: AdminServicesIndexProps) {
    const [deleting, setDeleting] = useState<AdminServiceRow | null>(null);
    const [processing, setProcessing] = useState(false);
    const [query, setQuery] = useState('');

    // Client-side search over the current page; the full catalogue is 14 rows.
    const needle = query.trim().toLowerCase();
    const rows =
        needle === ''
            ? services
            : services.filter(
                  (service) =>
                      service.name.toLowerCase().includes(needle) ||
                      (service.category?.name ?? '').toLowerCase().includes(needle),
              );

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        router.delete(routes.admin.service(deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const columns: Array<DataTableColumn<AdminServiceRow>> = [
        {
            key: 'name',
            header: 'Услуга',
            sortable: true,
            accessor: (row) => row.name,
            render: (row) => (
                <span>
                    <Link
                        href={routes.admin.serviceEdit(row.id)}
                        className="block font-medium text-text-primary transition-all duration-300 hover:text-accent"
                    >
                        {row.name}
                    </Link>
                    {row.description !== null && row.description !== '' && (
                        <span className="line-clamp-1 text-xs text-text-secondary">
                            {row.description}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'category',
            header: 'Категория',
            sortable: true,
            accessor: (row) => row.category?.name,
            render: (row) => (
                <span className="text-text-secondary">{row.category?.name ?? '—'}</span>
            ),
        },
        {
            key: 'price',
            header: 'Базовая цена',
            sortable: true,
            align: 'right',
            accessor: (row) => Number(row.base_price_min),
            render: (row) => (
                <span className="whitespace-nowrap tabular-nums text-accent">
                    {formatPriceRange(row.base_price_min, row.base_price_max)}
                </span>
            ),
        },
        {
            key: 'duration_min',
            header: 'Длительность',
            sortable: true,
            align: 'right',
            accessor: (row) => row.duration_min,
            render: (row) => (
                <span className="whitespace-nowrap tabular-nums">
                    {formatDuration(row.duration_min)}
                </span>
            ),
        },
        {
            key: 'masters_count',
            header: 'Мастеров',
            sortable: true,
            align: 'right',
            accessor: (row) => row.masters_count ?? 0,
            render: (row) => <span className="tabular-nums">{row.masters_count ?? 0}</span>,
        },
        {
            key: 'is_active',
            header: 'Статус',
            sortable: true,
            accessor: (row) => (row.is_active ? 1 : 0),
            render: (row) =>
                row.is_active ? (
                    <Badge tone="emerald" dot>
                        В прайсе
                    </Badge>
                ) : (
                    <Badge tone="neutral" dot>
                        Скрыта
                    </Badge>
                ),
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            /*
             * The width hint has to go on the HEADER cell: the table lays out
             * with `table-layout: auto`, where a width on a body cell is only a
             * hint, so the column kept absorbing ~277px. Capping it hands the
             * slack to «Услуга», which no longer wraps mid-title.
             */
            headerClassName: 'w-[13rem]',
            className: 'w-[13rem] whitespace-nowrap',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Button href={routes.admin.serviceEdit(row.id)} variant="ghost" size="sm">
                        {PANEL.common.edit}
                    </Button>

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
            title={PANEL.admin.servicesTitle}
            subtitle="Прайс барбершопа: базовые цены, длительность и привязка к мастерам."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Услуги' },
            ]}
            actions={<Button href={routes.admin.servicesCreate}>{PANEL.common.create}</Button>}
        >
            <Head title={PANEL.admin.servicesTitle} />

            <div className="mb-6 w-full sm:w-80">
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск по названию или категории"
                    aria-label={PANEL.common.search}
                    className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/60 transition-all duration-300 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                />
            </div>

            <DataTable
                caption={PANEL.admin.servicesTitle}
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                meta={services_meta}
                links={services_links}
                empty={needle === '' ? 'Услуг пока нет' : 'Ничего не найдено'}
            />

            <ConfirmDialog
                open={deleting !== null}
                title={PANEL.common.confirmDeleteTitle}
                message={
                    deleting === null ? null : (
                        <>
                            Удалить услугу{' '}
                            <span className="text-text-primary">{deleting.name}</span>? Если по ней уже
                            есть записи, удаление будет отклонено — вместо этого снимите галочку
                            «В прайсе».
                        </>
                    )
                }
                processing={processing}
                onConfirm={remove}
                onClose={() => setDeleting(null)}
            />
        </AdminLayout>
    );
}
