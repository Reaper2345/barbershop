import { useMemo, useState, type FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { MODAL_ACTIONS_CLASS } from '@/Components/UI/Modal';
import { Input } from '@/Components/UI/Input';
import { Modal } from '@/Components/UI/Modal';
import { Badge } from '@/Components/UI/Badge';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AlertIcon, InfoIcon, ScissorsIcon } from '@/lib/icons';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { MASTER_COPY } from '@/lib/content';
import { formatDuration, formatPriceRange, cn } from '@/lib/format';
import type { MasterServiceRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Services/Index — GET /master/services
|--------------------------------------------------------------------------
| Every active catalogue service, with this master's overrides. The controller
| sends `price_min`/`price_max`/`duration_min` as null when no override exists,
| which means "inherit the catalogue value" — the UI shows the catalogue figure
| in that case and labels it as inherited.
|
| Editing is per row, in a modal (the brief allows inline or modal). A master
| cannot change the base service: name, category and base price are read-only
| and the PUT only carries price_min, price_max, duration_min and is_active.
|
| Guard rail: UpdateMasterServiceRequest enforces price_max >= price_min and
| duration 5–600. The client mirrors those checks so the master gets an
| immediate answer, and the controller re-validates.
*/

export interface MasterServicesProps {
    services?: MasterServiceRow[];
}

interface ServiceForm {
    price_min: string;
    price_max: string;
    duration_min: string;
    is_active: boolean;
}

export default function MasterServices({ services = [] }: MasterServicesProps) {
    const [editing, setEditing] = useState<MasterServiceRow | null>(null);
    const [query, setQuery] = useState('');
    const [onlyOffered, setOnlyOffered] = useState(false);

    /** Client-side filter: the catalogue is small (14 services). */
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return services.filter((service) => {
            if (onlyOffered && !service.is_active) {
                return false;
            }

            if (needle === '') {
                return true;
            }

            return (
                service.name.toLowerCase().includes(needle) ||
                (service.category ?? '').toLowerCase().includes(needle)
            );
        });
    }, [services, query, onlyOffered]);

    const offeredCount = services.filter((service) => service.is_active).length;

    return (
        <AdminLayout
            title={MASTER_COPY.servicesTitle}
            subtitle={MASTER_COPY.servicesSubtitle}
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'Мои услуги' }]}
        >
            <Head title={MASTER_COPY.servicesTitle} />

            {/* Explanation of the override model */}
            <p className="mb-6 flex items-start gap-2.5 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text-primary">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                    Базовые услуги и цены задаёт администратор. Вы можете{' '}
                    <span className="font-medium">сузить цену</span> и указать свою длительность —
                    оставьте поле пустым, чтобы использовать значение из прайса барбершопа.
                </span>
            </p>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-72">
                    <Input
                        label="Поиск"
                        name="search"
                        placeholder="Название или категория"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>

                <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                    <input
                        type="checkbox"
                        checked={onlyOffered}
                        onChange={(event) => setOnlyOffered(event.target.checked)}
                        className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    Только мои услуги
                </label>

                <span className="mt-6 text-xs text-text-secondary">
                    Включено услуг: <span className="text-text-primary">{offeredCount}</span> из{' '}
                    {services.length}
                </span>
            </div>

            {visible.length === 0 ? (
                <EmptyState
                    icon={<ScissorsIcon />}
                    title="Ничего не найдено"
                    description="Измените условия поиска или снимите фильтр."
                    action={
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setQuery('');
                                setOnlyOffered(false);
                            }}
                        >
                            Сбросить фильтры
                        </Button>
                    }
                />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[52rem] border-collapse text-sm">
                            <caption className="sr-only">Мои услуги и персональные цены</caption>

                            <thead>
                                <tr className="border-b border-border bg-bg-secondary text-xs uppercase tracking-wider text-text-secondary">
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Услуга
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Базовая цена
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Моя цена от
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Моя цена до
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Моя длительность
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Статус
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right">
                                        {' '}
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {visible.map((service) => (
                                    <tr
                                        key={service.id}
                                        className={cn(
                                            'border-b border-border/60 transition-colors duration-200 last:border-b-0',
                                            !service.is_active && 'bg-bg-secondary/40',
                                        )}
                                    >
                                        <th scope="row" className="px-4 py-3 text-left font-normal">
                                            <span className="block text-text-primary">
                                                {service.name}
                                            </span>
                                            {service.category !== null && (
                                                <span className="text-xs text-text-secondary">
                                                    {service.category}
                                                </span>
                                            )}
                                        </th>

                                        <td className="px-4 py-3 text-text-secondary tabular-nums">
                                            {service.base_price_label}
                                        </td>

                                        <OverrideCell
                                            value={service.price_min}
                                            inherited={service.base_price_min}
                                        />

                                        <OverrideCell
                                            value={service.price_max}
                                            inherited={service.base_price_max}
                                        />

                                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                                            {service.duration_min === null ? (
                                                <span className="text-text-secondary">
                                                    {formatDuration(service.base_duration_min)}
                                                    <span className="ml-1 text-xs">(из прайса)</span>
                                                </span>
                                            ) : (
                                                <span className="text-text-primary">
                                                    {formatDuration(service.duration_min)}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            {service.is_active ? (
                                                <Badge tone="emerald" dot>
                                                    Оказываю
                                                </Badge>
                                            ) : (
                                                <Badge tone="neutral" dot>
                                                    Не оказываю
                                                </Badge>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditing(service)}
                                            >
                                                Изменить
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <EditServiceModal service={editing} onClose={() => setEditing(null)} />
        </AdminLayout>
    );
}

/** A price cell that distinguishes an override from an inherited value. */
function OverrideCell({
    value,
    inherited,
}: {
    value: number | null;
    inherited: number;
}) {
    if (value === null) {
        return (
            <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                <span className="text-text-secondary">
                    {formatPriceRange(inherited, inherited)}
                    <span className="ml-1 text-xs">(из прайса)</span>
                </span>
            </td>
        );
    }

    return (
        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
            <span className="text-accent">{formatPriceRange(value, value)}</span>
        </td>
    );
}

/*
|--------------------------------------------------------------------------
| Edit modal
|--------------------------------------------------------------------------
*/

/** Modal shell: mounting it per service guarantees fresh form state. */
function EditServiceModal({
    service,
    onClose,
}: {
    service: MasterServiceRow | null;
    onClose: () => void;
}) {
    if (service === null) {
        return null;
    }

    return <EditServiceForm key={service.id} service={service} onClose={onClose} />;
}

function EditServiceForm({
    service,
    onClose,
}: {
    service: MasterServiceRow;
    onClose: () => void;
}) {
    /*
     * Initialised once per mount; the component is keyed by service id, so a
     * different service always starts from its own values.
     *
     * A NULL override means "inherit the catalogue value", and starting the
     * fields from '' made an inherited price look like a missing one — the
     * master opened the modal and saw three empty boxes where the table shows
     * numbers. The catalogue value is the fallback instead; the table keeps
     * labelling inherited figures with «(из прайса)».
     */
    const form = useForm<ServiceForm>({
        price_min: String(service.price_min ?? service.base_price_min),
        price_max: String(service.price_max ?? service.base_price_max),
        duration_min: String(service.duration_min ?? service.base_duration_min),
        is_active: service.is_active,
    });

    const [localError, setLocalError] = useState<string | null>(null);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const min = form.data.price_min === '' ? null : Number(form.data.price_min);
        const max = form.data.price_max === '' ? null : Number(form.data.price_max);

        // Mirrors UpdateMasterServiceRequest: a max without a min is invalid,
        // and max must not be below min.
        if (min === null && max !== null) {
            setLocalError('Укажите минимальную цену диапазона.');

            return;
        }

        if (min !== null && max === null) {
            setLocalError('Укажите максимальную цену диапазона.');

            return;
        }

        if (min !== null && max !== null && max < min) {
            setLocalError('Максимальная цена не может быть меньше минимальной.');

            return;
        }

        const duration = form.data.duration_min === '' ? null : Number(form.data.duration_min);

        if (duration !== null && (duration < 5 || duration > 600)) {
            setLocalError('Длительность должна быть от 5 до 600 минут.');

            return;
        }

        setLocalError(null);

        form.transform((data) => ({
            price_min: data.price_min === '' ? null : Number(data.price_min),
            price_max: data.price_max === '' ? null : Number(data.price_max),
            duration_min: data.duration_min === '' ? null : Number(data.duration_min),
            is_active: data.is_active,
        }));

        form.put(routes.masterArea.service(service.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="md"
            title={service.name}
            description="Персональная цена и длительность видны клиентам при записи именно к вам."
        >
            <form onSubmit={submit} className="space-y-5" noValidate>
                <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm">
                    <p className="text-text-secondary">
                        Базовый прайс:{' '}
                        <span className="text-text-primary">{service.base_price_label}</span>
                        {' · '}
                        {formatDuration(service.base_duration_min)}
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                        label="Моя цена от, ₽"
                        name="price_min"
                        type="number"
                        min={0}
                        step={50}
                        placeholder={`${service.base_price_min}`}
                        value={form.data.price_min}
                        error={form.errors.price_min}
                        hint="Пусто — цена из прайса"
                        onChange={(event) => form.setData('price_min', event.target.value)}
                    />

                    <Input
                        label="Моя цена до, ₽"
                        name="price_max"
                        type="number"
                        min={0}
                        step={50}
                        placeholder={`${service.base_price_max}`}
                        value={form.data.price_max}
                        error={form.errors.price_max}
                        onChange={(event) => form.setData('price_max', event.target.value)}
                    />
                </div>

                <Input
                    label="Моя длительность, минут"
                    name="duration_min"
                    type="number"
                    min={5}
                    max={600}
                    step={5}
                    placeholder={`${service.base_duration_min}`}
                    value={form.data.duration_min}
                    error={form.errors.duration_min}
                    hint="Пусто — длительность из прайса"
                    onChange={(event) => form.setData('duration_min', event.target.value)}
                />

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm">
                    <input
                        type="checkbox"
                        checked={form.data.is_active}
                        onChange={(event) => form.setData('is_active', event.target.checked)}
                        className="h-4 w-4 rounded border-border bg-bg-elevated text-accent focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <span className="text-text-primary">Я оказываю эту услугу</span>
                </label>

                {localError !== null && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {localError}
                    </p>
                )}

                <div className={cn(MODAL_ACTIONS_CLASS, 'flex-col sm:flex-row-reverse')}>
                    <Button type="submit" loading={form.processing} fullWidth className="sm:w-auto">
                        Сохранить
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={form.processing}
                        fullWidth
                        className="sm:w-auto"
                    >
                        Отмена
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
