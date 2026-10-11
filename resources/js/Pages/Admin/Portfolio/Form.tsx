import { Head } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PortfolioItemForm } from '@/Components/Portfolio/PortfolioItemForm';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Portfolio/Form — create + edit
|--------------------------------------------------------------------------
| One page for both modes: `item` is null when creating (the controller's
| create()) and a row when editing (edit()). The only structural difference is
| the presence of the master select, which the admin always gets.
*/

export interface AdminPortfolioFormProps {
    item?: PortfolioItemRow | null;
    masters?: Array<{ id: number; name: string }>;
}

export default function AdminPortfolioForm({
    item = null,
    masters = [],
}: AdminPortfolioFormProps) {
    const isEdit = item !== null;

    return (
        <AdminLayout
            title={isEdit ? 'Работа в портфолио' : 'Новая работа'}
            subtitle={
                isEdit
                    ? 'Фотография, описание и публикация работы.'
                    : 'Загрузите фотографию работы и опишите её — она появится на сайте.'
            }
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Портфолио', href: routes.admin.portfolio() },
                { label: isEdit ? 'Редактирование' : 'Создание' },
            ]}
        >
            <Head title={isEdit ? 'Работа в портфолио' : 'Новая работа'} />

            <PortfolioItemForm
                item={item}
                masters={masters}
                action={
                    isEdit && item !== null
                        ? routes.admin.portfolioItem(item.id)
                        : routes.admin.portfolio()
                }
                cancelHref={routes.admin.portfolio()}
            />
        </AdminLayout>
    );
}
