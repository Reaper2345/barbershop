import { Head } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PortfolioItemForm } from '@/Components/Portfolio/PortfolioItemForm';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Portfolio/Form — create + edit
|--------------------------------------------------------------------------
| Identical to the admin form without the master select: the controller always
| writes to $request->user()->master, so there is no master to choose.
*/

export interface MasterPortfolioFormProps {
    item?: PortfolioItemRow | null;
}

export default function MasterPortfolioForm({ item = null }: MasterPortfolioFormProps) {
    const isEdit = item !== null;

    return (
        <AdminLayout
            title={isEdit ? 'Работа в портфолио' : 'Новая работа'}
            subtitle={
                isEdit
                    ? 'Фотография, описание и публикация работы.'
                    : 'Загрузите фотографию работы и опишите её — она появится на сайте.'
            }
            nav={masterNav}
            breadcrumbs={[
                { label: 'Кабинет мастера' },
                { label: 'Портфолио', href: routes.masterArea.portfolio },
                { label: isEdit ? 'Редактирование' : 'Создание' },
            ]}
        >
            <Head title={isEdit ? 'Работа в портфолио' : 'Новая работа'} />

            <PortfolioItemForm
                item={item}
                action={
                    isEdit && item !== null
                        ? routes.masterArea.portfolioItem(item.id)
                        : routes.masterArea.portfolio
                }
                cancelHref={routes.masterArea.portfolio}
            />
        </AdminLayout>
    );
}
