import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PortfolioItemsTable } from '@/Components/Portfolio/PortfolioItemsTable';
import { PortfolioItemForm } from '@/Components/Portfolio/PortfolioItemForm';
import { Button } from '@/Components/UI/Button';
import { Modal } from '@/Components/UI/Modal';
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
|
| Create and edit open in a modal; the master panel never needs the master
| select, and the standalone create/edit pages still work.
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
    const [dialog, setDialog] = useState<'create' | PortfolioItemRow | null>(null);

    return (
        <AdminLayout
            title="Портфолио"
            subtitle="Ваши работы: фотографии, описания и публикация на сайте."
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'Портфолио' }]}
            actions={
                <Button onClick={() => setDialog('create')}>{PANEL.common.create}</Button>
            }
        >
            <Head title="Портфолио" />

            {/* Plain note: the bordered card double-framed the table below it. */}
            <p className="mb-6 max-w-3xl text-sm text-text-secondary">
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
                onEdit={setDialog}
            />

            <Modal
                open={dialog !== null}
                onClose={() => setDialog(null)}
                size="lg"
                title={dialog === 'create' || dialog === null ? 'Новая работа' : 'Работа в портфолио'}
                description={
                    dialog === 'create' || dialog === null
                        ? 'Загрузите фотографию работы и опишите её — она появится на сайте.'
                        : 'Фотография, описание и публикация работы.'
                }
            >
                {dialog !== null && (
                    <PortfolioItemForm
                        key={dialog === 'create' ? 'create' : `edit-${dialog.id}`}
                        item={dialog === 'create' ? null : dialog}
                        action={
                            dialog !== 'create'
                                ? routes.masterArea.portfolioItem(dialog.id)
                                : routes.masterArea.portfolio
                        }
                        cancelHref={routes.masterArea.portfolio}
                        embedded
                        onDone={() => setDialog(null)}
                    />
                )}
            </Modal>
        </AdminLayout>
    );
}
