import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PortfolioItemsTable } from '@/Components/Portfolio/PortfolioItemsTable';
import { Button } from '@/Components/UI/Button';
import { Select } from '@/Components/UI/Select';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import type { DataTablePaginationLinks, DataTablePaginationMeta } from '@/Components/Admin/DataTable';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Portfolio/Index — GET /admin/portfolio
|--------------------------------------------------------------------------
| Every work of every master, drafts included. `?master={id}` narrows the
| list; the select performs a real visit (preserveState) so the paginator and
| the URL stay in step.
*/

export interface AdminPortfolioIndexProps {
    items?: PortfolioItemRow[];
    items_meta?: DataTablePaginationMeta;
    items_links?: DataTablePaginationLinks;
    masters?: Array<{ id: number; name: string }>;
    filters?: { master: number | null };
}

export default function AdminPortfolioIndex({
    items = [],
    items_meta,
    items_links,
    masters = [],
    filters,
}: AdminPortfolioIndexProps) {
    const activeMaster = filters?.master ?? null;

    return (
        <AdminLayout
            title="Портфолио"
            subtitle="Работы мастеров: фото, описание и публикация на сайте."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Портфолио' },
            ]}
            actions={
                <Button href={routes.admin.portfolioCreate}>{PANEL.common.create}</Button>
            }
        >
            <Head title="Портфолио" />

            <div className="mb-6 w-full sm:w-80">
                <Select
                    label="Мастер"
                    name="master"
                    options={masters.map((master) => ({
                        value: master.id,
                        label: master.name,
                    }))}
                    placeholder="Все мастера"
                    value={activeMaster === null ? '' : String(activeMaster)}
                    onChange={(event) => {
                        const value = event.target.value;

                        router.get(
                            value === '' ? routes.admin.portfolio() : routes.admin.portfolio(value),
                            {},
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>

            <PortfolioItemsTable
                items={items}
                meta={items_meta}
                links={items_links}
                showMaster
                editHref={(item) => routes.admin.portfolioEdit(item.id)}
                destroyUrl={(item) => routes.admin.portfolioItem(item.id)}
                toggleUrl={(item) => routes.admin.portfolioToggle(item.id)}
            />
        </AdminLayout>
    );
}
