import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { SeoModal } from '@/Components/Admin/SeoModal';
import { Button } from '@/Components/UI/Button';
import { Badge } from '@/Components/UI/Badge';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { formatDate } from '@/lib/format';
import type { AdminPageRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Pages/Index — GET /admin/pages
|--------------------------------------------------------------------------
| Static content pages (about, contacts, …). The `content` column holds HTML
| authored here and rendered publicly after client-side sanitisation, so the
| list shows only a length hint rather than the markup.
*/

export interface AdminPagesIndexProps {
    pages?: AdminPageRow[];
    pages_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    pages_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
}

export default function AdminPagesIndex({
    pages = [],
    pages_meta,
    pages_links,
}: AdminPagesIndexProps) {
    const [deleting, setDeleting] = useState<AdminPageRow | null>(null);
    const [seoPage, setSeoPage] = useState<AdminPageRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        setProcessing(true);

        // Page binds by slug (Page::getRouteKeyName), not by id — using the
        // numeric id here deleted nothing and 404'd instead.
        router.delete(routes.admin.page(deleting.slug), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    const columns: Array<DataTableColumn<AdminPageRow>> = [
        {
            key: 'title',
            header: 'Заголовок',
            sortable: true,
            accessor: (row) => row.title,
            render: (row) => (
                <Link
                    href={routes.admin.pageEdit(row.slug)}
                    className="font-medium text-text-primary transition-all duration-300 hover:text-accent"
                >
                    {row.title}
                </Link>
            ),
        },
        {
            key: 'slug',
            header: 'Адрес',
            sortable: true,
            accessor: (row) => row.slug,
            render: (row) => (
                <Link
                    href={`/${row.slug}`}
                    className="text-xs text-text-secondary transition-all duration-300 hover:text-accent"
                >
                    /{row.slug}
                </Link>
            ),
        },
        {
            key: 'is_published',
            header: 'Статус',
            sortable: true,
            accessor: (row) => (row.is_published ? 1 : 0),
            render: (row) =>
                row.is_published ? (
                    <Badge tone="emerald" dot>
                        Опубликована
                    </Badge>
                ) : (
                    <Badge tone="neutral" dot>
                        Черновик
                    </Badge>
                ),
        },
        {
            key: 'content',
            header: 'Содержимое',
            align: 'right',
            render: (row) => (
                <span className="text-xs text-text-secondary tabular-nums">
                    {row.content.length} симв.
                </span>
            ),
        },
        {
            key: 'updated_at',
            header: 'Обновлена',
            sortable: true,
            accessor: (row) => row.updated_at,
            render: (row) => (
                <span className="whitespace-nowrap text-text-secondary">
                    {formatDate(row.updated_at ?? null)}
                </span>
            ),
        },
        {
            key: 'seo',
            header: 'SEO',
            render: (row) =>
                row.meta_title !== null && row.meta_title !== undefined && row.meta_title !== '' ? (
                    <Badge tone="emerald" dot>
                        Заполнено
                    </Badge>
                ) : (
                    <Badge tone="neutral" dot>
                        По умолчанию
                    </Badge>
                ),
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Button href={routes.admin.pageEdit(row.slug)} variant="ghost" size="sm">
                        {PANEL.common.edit}
                    </Button>

                    {/* SEO lives in a modal: two fields, no page reload. */}
                    <Button variant="ghost" size="sm" onClick={() => setSeoPage(row)}>
                        SEO
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
            title={PANEL.admin.pagesTitle}
            subtitle="Текстовые страницы сайта: «О нас», «Контакты» и другие."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Страницы' },
            ]}
            actions={<Button href={routes.admin.pagesCreate}>{PANEL.common.create}</Button>}
        >
            <Head title={PANEL.admin.pagesTitle} />

            <DataTable
                caption={PANEL.admin.pagesTitle}
                columns={columns}
                rows={pages}
                rowKey={(row) => row.id}
                meta={pages_meta}
                links={pages_links}
                empty="Страниц пока нет"
            />

            <ConfirmDialog
                open={deleting !== null}
                title={PANEL.common.confirmDeleteTitle}
                message={
                    deleting === null ? null : (
                        <>
                            Удалить страницу{' '}
                            <span className="text-text-primary">{deleting.title}</span>? Адрес{' '}
                            <code>/{deleting.slug}</code> перестанет открываться.
                        </>
                    )
                }
                processing={processing}
                onConfirm={remove}
                onClose={() => setDeleting(null)}
            />

            <SeoModal open={seoPage !== null} page={seoPage} onClose={() => setSeoPage(null)} />
        </AdminLayout>
    );
}
