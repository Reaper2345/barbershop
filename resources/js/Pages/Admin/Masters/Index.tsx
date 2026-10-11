import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { Button } from '@/Components/UI/Button';
import { Badge } from '@/Components/UI/Badge';
import { Img } from '@/Components/UI/Img';
import { RatingStars } from '@/Components/UI/RatingStars';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { masterPhoto } from '@/lib/image';
import { formatExperience } from '@/lib/format';
import type { AdminMasterRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Masters/Index — GET /admin/masters
|--------------------------------------------------------------------------
| Deleting a master does NOT delete the user: Admin\MasterController@destroy
| removes the profile and demotes the user back to `client`, so the copy in the
| confirm dialog says exactly that.
*/

export interface AdminMastersIndexProps {
    masters?: AdminMasterRow[];
    masters_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    masters_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
}

export default function AdminMastersIndex({
    masters = [],
    masters_meta,
    masters_links,
}: AdminMastersIndexProps) {
    const [deleting, setDeleting] = useState<AdminMasterRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        router.delete(routes.admin.master(deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const columns: Array<DataTableColumn<AdminMasterRow>> = [
        {
            key: 'photo',
            header: '',
            className: 'w-16',
            render: (row) => (
                <span className="block h-10 w-10 overflow-hidden rounded-xl border border-border bg-bg-secondary">
                    <Img
                        src={masterPhoto(row.photo, row.user?.name)}
                        fallbackSrc="/images/placeholder-master.svg"
                        alt=""
                        width={40}
                        height={40}
                        wrapperClassName="h-full w-full"
                    />
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Мастер',
            sortable: true,
            accessor: (row) => row.user?.name,
            render: (row) => (
                <span>
                    <Link
                        href={routes.admin.masterEdit(row.id)}
                        className="block font-medium text-text-primary transition-all duration-300 hover:text-accent"
                    >
                        {row.user?.name ?? '—'}
                    </Link>
                    <span className="text-xs text-text-secondary">{row.user?.email ?? ''}</span>
                </span>
            ),
        },
        {
            key: 'experience_years',
            header: 'Опыт',
            sortable: true,
            accessor: (row) => row.experience_years,
            render: (row) => (
                <span className="whitespace-nowrap">{formatExperience(row.experience_years)}</span>
            ),
        },
        {
            key: 'rating',
            header: 'Рейтинг',
            sortable: true,
            accessor: (row) => Number(row.rating),
            render: (row) => (
                <RatingStars value={row.rating} count={row.reviews_count} size="sm" />
            ),
        },
        {
            key: 'services_count',
            header: 'Услуг',
            sortable: true,
            align: 'right',
            accessor: (row) => row.services_count ?? 0,
            render: (row) => <span className="tabular-nums">{row.services_count ?? 0}</span>,
        },
        {
            key: 'appointments_count',
            header: 'Записей',
            sortable: true,
            align: 'right',
            accessor: (row) => row.appointments_count ?? 0,
            render: (row) => <span className="tabular-nums">{row.appointments_count ?? 0}</span>,
        },
        {
            key: 'is_active',
            header: 'Статус',
            sortable: true,
            accessor: (row) => (row.is_active ? 1 : 0),
            render: (row) =>
                row.is_active ? (
                    <Badge tone="emerald" dot>
                        Принимает
                    </Badge>
                ) : (
                    <Badge tone="neutral" dot>
                        Отключён
                    </Badge>
                ),
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Button href={routes.admin.masterEdit(row.id)} variant="ghost" size="sm">
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
            title={PANEL.admin.mastersTitle}
            subtitle="Барберы, их профили и загрузка фотографий."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Мастера' },
            ]}
            actions={<Button href={routes.admin.mastersCreate}>{PANEL.common.create}</Button>}
        >
            <Head title={PANEL.admin.mastersTitle} />

            <DataTable
                caption={PANEL.admin.mastersTitle}
                columns={columns}
                rows={masters}
                rowKey={(row) => row.id}
                meta={masters_meta}
                links={masters_links}
                empty="Мастеров пока нет"
            />

            <ConfirmDialog
                open={deleting !== null}
                title="Удалить профиль мастера?"
                message={
                    deleting === null ? null : (
                        <>
                            Мастер <span className="text-text-primary">{deleting.user?.name}</span>{' '}
                            перестанет принимать записи. Учётная запись сохранится и станет ролью
                            «Клиент» — чтобы вернуть мастера, создайте профиль заново.
                            {(deleting.appointments_count ?? 0) > 0 && (
                                <>
                                    {' '}
                                    Внимание: у него {deleting.appointments_count}{' '}
                                    {plural(deleting.appointments_count ?? 0, 'запись', 'записи', 'записей')},
                                    которые будут удалены вместе с профилем.
                                </>
                            )}
                        </>
                    )
                }
                confirmLabel="Удалить профиль"
                processing={processing}
                onConfirm={remove}
                onClose={() => setDeleting(null)}
            />
        </AdminLayout>
    );
}

function plural(count: number, one: string, few: string, many: string): string {
    const mod100 = count % 100;
    const mod10 = count % 10;

    if (mod100 > 10 && mod100 < 20) {
        return many;
    }

    if (mod10 === 1) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4) {
        return few;
    }

    return many;
}
