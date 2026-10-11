import { useState, type FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Select } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { AlertIcon, CheckIcon, InfoIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/format';
import type { AdminServiceRow, CategorySummary } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Services/Form — create & edit
|--------------------------------------------------------------------------
| Fields validated by Admin\ServiceController: category_id, name, description,
| base_price_min/max (max >= min), duration_min (5–600), is_active.
|
| Bulk master assignment: the brief asks for a bulk sync with master_service.
| `masters` (id + name) is passed by the controller; the picked ids are posted
| as `master_ids[]` and the controller attaches/detaches the pivot rows. The
| per-master price overrides are left untouched — those belong to the master.
*/

export interface AdminServiceFormProps {
    service?: AdminServiceRow | null;
    categories?: CategorySummary[];
    masters?: Array<{ id: number; name: string }>;
    /** Masters already linked to this service (edit mode). */
    assignedMasterIds?: number[];
}

interface ServiceForm {
    category_id: string;
    name: string;
    description: string;
    base_price_min: string;
    base_price_max: string;
    duration_min: string;
    is_active: boolean;
    master_ids: number[];
}

export default function AdminServiceForm({
    service = null,
    categories = [],
    masters = [],
    assignedMasterIds = [],
}: AdminServiceFormProps) {
    const isEdit = service !== null;

    const form = useForm<ServiceForm>({
        category_id: service?.category_id === undefined ? '' : String(service.category_id),
        name: service?.name ?? '',
        description: service?.description ?? '',
        base_price_min: service?.base_price_min ?? '',
        base_price_max: service?.base_price_max ?? '',
        duration_min: String(service?.duration_min ?? 60),
        is_active: service?.is_active ?? true,
        master_ids: assignedMasterIds,
    });

    const [localError, setLocalError] = useState<string | null>(null);

    const toggleMaster = (id: number): void => {
        const next = form.data.master_ids.includes(id)
            ? form.data.master_ids.filter((value) => value !== id)
            : [...form.data.master_ids, id];

        form.setData('master_ids', next);
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (form.data.category_id === '') {
            setLocalError('Выберите категорию.');

            return;
        }

        const min = Number(form.data.base_price_min);
        const max = Number(form.data.base_price_max);

        if (Number.isNaN(min) || min < 0) {
            setLocalError('Укажите минимальную цену.');

            return;
        }

        if (Number.isNaN(max) || max < min) {
            setLocalError('Максимальная цена не может быть меньше минимальной.');

            return;
        }

        const duration = Number(form.data.duration_min);

        if (Number.isNaN(duration) || duration < 5 || duration > 600) {
            setLocalError('Длительность должна быть от 5 до 600 минут.');

            return;
        }

        setLocalError(null);

        form.transform((data) => ({
            category_id: Number(data.category_id),
            name: data.name,
            description: data.description,
            base_price_min: Number(data.base_price_min),
            base_price_max: Number(data.base_price_max),
            duration_min: Number(data.duration_min),
            is_active: data.is_active,
            master_ids: data.master_ids,
        }));

        if (isEdit && service !== null) {
            form.put(routes.admin.service(service.id));

            return;
        }

        form.post(routes.admin.services);
    };

    return (
        <AdminLayout
            title={isEdit ? `Услуга: ${service.name}` : 'Новая услуга'}
            subtitle="Базовая цена видна на сайте; мастера могут сузить её в своём кабинете."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Услуги', href: routes.admin.services },
                { label: isEdit ? 'Редактирование' : 'Создание' },
            ]}
        >
            <Head title={isEdit ? 'Услуга' : 'Новая услуга'} />

            <form onSubmit={submit} className="max-w-3xl space-y-8" noValidate>
                <div className="space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <Select
                        label="Категория"
                        name="category_id"
                        required
                        placeholder="Выберите категорию"
                        value={form.data.category_id}
                        error={form.errors.category_id}
                        options={categories.map((category) => ({
                            value: category.id,
                            label: category.name,
                        }))}
                        onChange={(event) => form.setData('category_id', event.target.value)}
                    />

                    <Input
                        label="Название"
                        name="name"
                        required
                        maxLength={255}
                        placeholder="Например: Мужская стрижка"
                        value={form.data.name}
                        error={form.errors.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                    />

                    <Textarea
                        label="Описание"
                        name="description"
                        rows={4}
                        maxLength={5000}
                        placeholder="Что входит в услугу, сколько занимает времени"
                        value={form.data.description}
                        error={form.errors.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                    />

                    <div className="grid gap-6 sm:grid-cols-3">
                        <Input
                            label="Цена от, ₽"
                            name="base_price_min"
                            type="number"
                            min={0}
                            step={50}
                            required
                            value={form.data.base_price_min}
                            error={form.errors.base_price_min}
                            onChange={(event) =>
                                form.setData('base_price_min', event.target.value)
                            }
                        />

                        <Input
                            label="Цена до, ₽"
                            name="base_price_max"
                            type="number"
                            min={0}
                            step={50}
                            required
                            value={form.data.base_price_max}
                            error={form.errors.base_price_max}
                            onChange={(event) =>
                                form.setData('base_price_max', event.target.value)
                            }
                        />

                        <Input
                            label="Длительность, мин"
                            name="duration_min"
                            type="number"
                            min={5}
                            max={600}
                            step={5}
                            required
                            value={form.data.duration_min}
                            error={form.errors.duration_min}
                            hint={
                                form.data.duration_min === ''
                                    ? undefined
                                    : formatDuration(Number(form.data.duration_min))
                            }
                            onChange={(event) => form.setData('duration_min', event.target.value)}
                        />
                    </div>

                    <label
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-300',
                            form.data.is_active
                                ? 'border-accent/50 bg-accent/5'
                                : 'border-border bg-bg-secondary',
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-border bg-bg-elevated text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        />
                        <span className="text-text-primary">
                            Услуга в прайсе
                            <span className="ml-2 text-xs text-text-secondary">
                                скрытые услуги недоступны для записи
                            </span>
                        </span>
                    </label>
                </div>

                {/* Bulk master assignment */}
                <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Кто оказывает услугу
                    </legend>

                    <p className="flex items-start gap-2 text-xs text-text-secondary">
                        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        Отметьте мастеров, которым доступна эта услуга. Свои цены и длительность
                        каждый мастер настраивает в разделе «Мои услуги».
                    </p>

                    {masters.length === 0 ? (
                        <p className="text-sm text-text-secondary">
                            Мастеров пока нет — сначала добавьте мастера.
                        </p>
                    ) : (
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {masters.map((master) => {
                                const checked = form.data.master_ids.includes(master.id);

                                return (
                                    <li key={master.id}>
                                        <label
                                            className={cn(
                                                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-300',
                                                checked
                                                    ? 'border-accent/60 bg-accent/5 text-text-primary'
                                                    : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/40',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleMaster(master.id)}
                                                className="sr-only"
                                            />

                                            <span
                                                className={cn(
                                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                                                    checked
                                                        ? 'border-accent bg-accent text-bg-primary'
                                                        : 'border-border',
                                                )}
                                                aria-hidden="true"
                                            >
                                                {checked && <CheckIcon className="h-3.5 w-3.5" />}
                                            </span>

                                            <span className="min-w-0 flex-1 truncate">
                                                {master.name}
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {form.errors.master_ids !== undefined && (
                        <p role="alert" className="text-xs text-danger">
                            {form.errors.master_ids}
                        </p>
                    )}

                    <p className="text-xs text-text-secondary">
                        Выбрано мастеров: <span className="text-text-primary">{form.data.master_ids.length}</span>
                    </p>
                </fieldset>

                {(localError !== null || form.hasErrors) && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {localError ?? 'Проверьте выделенные поля.'}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" loading={form.processing} size="lg">
                        {isEdit ? PANEL.common.save : PANEL.common.create}
                    </Button>

                    <Link
                        href={routes.admin.services}
                        className="text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                    >
                        {PANEL.common.back}
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
