import { Head } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PortfolioItemsTable } from '@/Components/Portfolio/PortfolioItemsTable';
import { Button } from '@/Components/UI/Button';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import type { DataTablePaginationLinks, DataTablePaginationMeta } from '@/Components/Admin/DataTable';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Portfolio/Index — GET /master/portfolio
|--------------------------------------------------------------------------
| The master's own works, drafts included. Same table as the admin panel minus
| the master column and the master filter — every row is his.
*/

export interface MasterPortfolioIndexProps {
    items?: PortfolioItemRow[];
    items_meta?: DataTablePaginationMeta;
    items_links?: DataTablePaginationLinks;
}

export default function MasterPortfolioIndex({
    items = [],
    items_meta,
    items_links,
}: MasterPortfolioIndexProps) {
    return (
        <AdminLayout
            title="Портфолио"
            subtitle="Ваши работы: фотографии, описания и публикация на сайте."
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'Портфолио' }]}
            actions={
                <Button href={routes.masterArea.portfolioCreate}>{PANEL.common.create}</Button>
            }
        >
            <Head title="Портфолио" />

            <p className="mb-6 rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-secondary">
                Работы с включённой публикацией видны в разделе{' '}
                <span className="text-text-primary">/portfolio</span> и на вашей странице
                мастера. Черновики видите только вы.
            </p>

            <PortfolioItemsTable
                items={items}
                meta={items_meta}
                links={items_links}
                editHref={(item) => routes.masterArea.portfolioEdit(item.id)}
                destroyUrl={(item) => routes.masterArea.portfolioItem(item.id)}
                toggleUrl={(item) => routes.masterArea.portfolioToggle(item.id)}
            />
        </AdminLayout>
    );
}
