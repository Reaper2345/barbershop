import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { Button } from '@/Components/UI/Button';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import type { AdminCategoryRow, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Categories/Index — GET /admin/categories
|--------------------------------------------------------------------------
| Category CRUD. Deletion is refused by the controller while the category still
| contains services (services.category_id cascades, so deleting would silently
| take the services with it) — the dialog says so rather than surfacing a raw
| database error.
*/

export interface AdminCategoriesIndexProps {
    categories?: AdminCategoryRow[];
    categories_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    categories_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
}

export default function AdminCategoriesIndex({
    categories = [],
    categories_meta,
    categories_links,
}: AdminCategoriesIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const [deleting, setDeleting] = useState<AdminCategoryRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        router.delete(routes.admin.category(deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const columns: Array<DataTableColumn<AdminCategoryRow>> = [
        {
            key: 'sort_order',
            header: 'Порядок',
            sortable: true,
            accessor: (row) => row.sort_order,
            render: (row) => <span className="tabular-nums text-text-secondary">{row.sort_order}</span>,
            className: 'w-24',
        },
        {
            key: 'name',
            header: 'Название',
            sortable: true,
            accessor: (row) => row.name,
            render: (row) => (
                <Link
                    href={routes.admin.categoryEdit(row.id)}
                    className="font-medium text-text-primary transition-all duration-300 hover:text-accent"
                >
                    {row.name}
                </Link>
            ),
        },
        {
            key: 'slug',
            header: 'Адрес (slug)',
            sortable: true,
            accessor: (row) => row.slug,
            render: (row) => <code className="text-xs text-text-secondary">{row.slug}</code>,
        },
        {
            key: 'services_count',
            header: 'Услуг',
            sortable: true,
            align: 'right',
            accessor: (row) => row.services_count ?? 0,
            render: (row) => (
                <span className="tabular-nums">{row.services_count ?? 0}</span>
            ),
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Button href={routes.admin.categoryEdit(row.id)} variant="ghost" size="sm">
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
            title={PANEL.admin.categoriesTitle}
            subtitle="Направления, по которым сгруппирован прайс."
            nav={buildAdminNav()}
            breadcrumbs={[{ label: 'Панель управления', href: routes.admin.dashboard }, { label: 'Категории' }]}
            actions={
                <Button href={routes.admin.categoriesCreate} disabled={auth.user?.role !== 'admin'}>
                    {PANEL.common.create}
                </Button>
            }
        >
            <Head title={PANEL.admin.categoriesTitle} />

            <DataTable
                caption={PANEL.admin.categoriesTitle}
                columns={columns}
                rows={categories}
                rowKey={(row) => row.id}
                meta={categories_meta}
                links={categories_links}
                empty="Категорий пока нет"
            />

            <ConfirmDialog
                open={deleting !== null}
                title={PANEL.common.confirmDeleteTitle}
                message={
                    deleting === null ? null : (
                        <>
                            Удалить категорию{' '}
                            <span className="text-text-primary">{deleting.name}</span>?
                            {(deleting.services_count ?? 0) > 0 ? (
                                <>
                                    {' '}
                                    В ней {deleting.services_count}{' '}
                                    {plural(deleting.services_count ?? 0, 'услуга', 'услуги', 'услуг')} —
                                    сначала перенесите или удалите их, иначе удаление будет отклонено.
                                </>
                            ) : (
                                ' Действие необратимо.'
                            )}
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
