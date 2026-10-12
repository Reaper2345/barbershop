import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PortfolioItemsTable } from '@/Components/Portfolio/PortfolioItemsTable';
import { PortfolioItemForm } from '@/Components/Portfolio/PortfolioItemForm';
import { Button } from '@/Components/UI/Button';
import { Modal } from '@/Components/UI/Modal';
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
|
| Create and edit open in a modal over the list — six fields, a photo and a
| publish switch, and the admin almost always arrives here from the list. The
| standalone /admin/portfolio/create and /{id}/edit pages still work.
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
    /** 'create', an item being edited, or null when the modal is closed. */
    const [dialog, setDialog] = useState<'create' | PortfolioItemRow | null>(null);

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
                <Button onClick={() => setDialog('create')}>{PANEL.common.create}</Button>
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
                        masters={masters}
                        action={
                            dialog !== 'create'
                                ? routes.admin.portfolioItem(dialog.id)
                                : routes.admin.portfolio()
                        }
                        cancelHref={routes.admin.portfolio()}
                        embedded
                        onDone={() => setDialog(null)}
                    />
                )}
            </Modal>
        </AdminLayout>
    );
}
