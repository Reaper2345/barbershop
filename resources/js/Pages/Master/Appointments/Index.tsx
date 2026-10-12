import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { Badge, StatusBadge } from '@/Components/UI/Badge';
import { Input } from '@/Components/UI/Input';
import { Textarea } from '@/Components/UI/Textarea';
import { Modal } from '@/Components/UI/Modal';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { EmptyState } from '@/Components/UI/EmptyState';
import { Pagination } from '@/Components/UI/Pagination';
import { AlertIcon, ClockIcon, PhoneIcon, QuoteIcon, ScissorsIcon } from '@/lib/icons';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { MASTER_COPY } from '@/lib/content';
import { formatDuration, cn } from '@/lib/format';
import { priceState } from '@/types';
import type { CabinetAppointment, Paginated, MasterAppointmentRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Appointments/Index — GET /master/appointments
|--------------------------------------------------------------------------
| The master's queue, split into the four tabs from the brief. Tabs map onto
| the controller's `?status=` filter, so each is a linkable URL.
|
| Actions mirror the three PATCH endpoints exactly:
|   confirm  (pending)              → price_min + price_max  OR  price_offer
|   reject   (pending)              → master_comment
|   status   (confirmed/in_progress) → in_progress → done
|
| The two confirm modals exist because the backend stores exactly one pricing
| shape: ConfirmAppointmentRequest rejects a payload carrying both a range and
| an offer.
*/

export interface MasterAppointmentsProps {
    appointments?: Paginated<MasterAppointmentRow> | MasterAppointmentRow[];
    filters?: { status?: string };
}

type TabId = 'pending' | 'confirmed' | 'done' | 'cancelled';

const TABS: TabId[] = ['pending', 'confirmed', 'done', 'cancelled'];

type ConfirmMode = 'range' | 'offer';

export default function MasterAppointments({
    appointments = [],
    filters,
}: MasterAppointmentsProps) {
    const rows = useMemo<MasterAppointmentRow[]>(
        () => (Array.isArray(appointments) ? appointments : appointments.data),
        [appointments],
    );

    const currentStatus = (filters?.status ?? '') as TabId | '';
    const activeTab: TabId = TABS.includes(currentStatus as TabId)
        ? (currentStatus as TabId)
        : 'pending';

    const [confirmTarget, setConfirmTarget] = useState<MasterAppointmentRow | null>(null);
    const [confirmMode, setConfirmMode] = useState<ConfirmMode>('range');
    const [rejectTarget, setRejectTarget] = useState<MasterAppointmentRow | null>(null);
    // Reference photos open in one overlay per page, not a new tab.
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

    // The list is server-filtered, so an empty tab is genuinely empty.
    const visible = rows;

    return (
        <AdminLayout
            title={MASTER_COPY.appointmentsTitle}
            subtitle={MASTER_COPY.appointmentsSubtitle}
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'Записи' }]}
        >
            <Head title={MASTER_COPY.appointmentsTitle} />

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Фильтр записей по статусу"
                className="flex gap-2 overflow-x-auto border-b border-border pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {TABS.map((tab) => {
                    const selected = tab === activeTab;

                    return (
                        <Link
                            key={tab}
                            href={routes.masterArea.appointments(tab)}
                            role="tab"
                            aria-selected={selected}
                            preserveScroll
                            className={cn(
                                'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-all duration-300',
                                'focus-visible:ring-2 focus-visible:ring-accent',
                                selected ? 'text-accent' : 'text-text-secondary hover:text-text-primary',
                            )}
                        >
                            {MASTER_COPY.tabs[tab]}

                            {selected && (
                                <span
                                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                                    aria-hidden="true"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>

            {visible.length === 0 ? (
                <EmptyState
                    className="mt-8"
                    icon={<ScissorsIcon />}
                    title={emptyTitle(activeTab)}
                    description={emptyText(activeTab)}
                />
            ) : (
                <ul className="mt-8 space-y-4">
                    {visible.map((row) => (
                        <li key={row.id}>
                            <AppointmentQueueCard
                                appointment={row}
                                onConfirmRange={() => {
                                    setConfirmMode('range');
                                    setConfirmTarget(row);
                                }}
                                onConfirmOffer={() => {
                                    setConfirmMode('offer');
                                    setConfirmTarget(row);
                                }}
                                onReject={() => setRejectTarget(row)}
                                onPhotoClick={setLightbox}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {!Array.isArray(appointments) && (
                <Pagination paginator={appointments} className="mt-10" />
            )}

            <ConfirmAppointmentModal
                appointment={confirmTarget}
                mode={confirmMode}
                onClose={() => setConfirmTarget(null)}
            />

            <RejectAppointmentModal
                appointment={rejectTarget}
                onClose={() => setRejectTarget(null)}
            />

            <Lightbox
                open={lightbox !== null}
                src={lightbox?.src ?? null}
                alt={lightbox?.alt ?? ''}
                caption={lightbox?.caption ?? null}
                onClose={() => setLightbox(null)}
            />
        </AdminLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Queue card
|--------------------------------------------------------------------------
| Everything the master needs to decide: who, what, when, the client's comment
| and the reference photo. Actions are rendered per status, and every one of
| them exists as a backend endpoint.
*/

function AppointmentQueueCard({
    appointment,
    onConfirmRange,
    onConfirmOffer,
    onReject,
    onPhotoClick,
}: {
    appointment: MasterAppointmentRow;
    onConfirmRange: () => void;
    onConfirmOffer: () => void;
    onReject: () => void;
    onPhotoClick: (photo: LightboxPhoto) => void;
}) {
    const form = useForm<{ status: string }>({ status: '' });
    const price = priceState(appointment as unknown as CabinetAppointment);

    const advance = (status: 'in_progress' | 'done'): void => {
        form.transform(() => ({ status }));
        form.patch(routes.masterArea.appointmentStatus(appointment.id), { preserveScroll: true });
    };

    const is = (status: string): boolean => appointment.status === status;

    return (
        <article className="rounded-2xl border border-border bg-bg-elevated p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold text-text-primary">
                            {appointment.client?.name ?? 'Клиент'}
                        </h3>

                        <StatusBadge status={appointment.status} />
                    </div>

                    {appointment.client?.phone !== null && appointment.client?.phone !== undefined && (
                        <a
                            href={`tel:${appointment.client.phone.replace(/[^\d+]/g, '')}`}
                            className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                        >
                            <PhoneIcon className="h-3.5 w-3.5" />
                            {appointment.client.phone}
                        </a>
                    )}
                </div>

                <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">
                        {appointment.starts_at_label ?? '—'}
                    </p>

                    {appointment.duration_min !== null &&
                        appointment.duration_min !== undefined &&
                        appointment.duration_min > 0 && (
                            <p className="mt-1 flex items-center justify-end gap-1.5 text-xs text-text-secondary">
                                <ClockIcon className="h-3.5 w-3.5" />
                                {formatDuration(appointment.duration_min)}
                            </p>
                        )}
                </div>
            </div>

            {/* Service + price state */}
            <div className="mt-5 border-t border-border pt-5">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-text-secondary">
                        Услуга: <span className="text-text-primary">{appointment.service?.name ?? '—'}</span>
                    </span>

                    {price.kind === 'offer' && (
                        <Badge tone="emerald">Подтверждено: {price.label}</Badge>
                    )}

                    {price.kind === 'range' && <Badge tone="accent">Диапазон: {price.label}</Badge>}

                    {price.kind === 'pending' && (
                        <Badge tone="neutral">Цена не указана</Badge>
                    )}
                </div>

                {/* What the service actually is, so the master can prepare. */}
                {appointment.service?.description !== null &&
                    appointment.service?.description !== undefined &&
                    appointment.service.description !== '' && (
                        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                            {appointment.service.description}
                        </p>
                    )}
            </div>

            {/* Client comment */}
            {appointment.client_comment !== null && appointment.client_comment !== '' && (
                <div className="mt-4 rounded-xl border border-border bg-bg-secondary px-4 py-3">
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
                        <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
                        <span>
                            <span className="font-medium text-text-primary">
                                Комментарий клиента:{' '}
                            </span>
                            {appointment.client_comment}
                        </span>
                    </p>
                </div>
            )}

            {/* Reference photo */}
            {appointment.photo_url != null && appointment.photo_url !== '' && (
                <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">
                        Фото-референс от клиента
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            onPhotoClick({
                                src: appointment.photo_url as string,
                                alt: `Фото-референс — ${appointment.client?.name ?? 'клиент'}`,
                                caption: appointment.client?.name ?? null,
                            })
                        }
                        aria-label="Открыть фото-референс"
                        className="inline-block cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <img
                            src={appointment.photo_url}
                            alt="Фотография-референс, приложенная клиентом"
                            className="h-40 w-auto object-cover"
                            loading="lazy"
                        />
                    </button>
                </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                {is('pending') && (
                    <>
                        <Button size="sm" onClick={onConfirmRange}>
                            Подтвердить с диапазоном
                        </Button>

                        <Button size="sm" variant="ghost" onClick={onConfirmOffer}>
                            Подтвердить с точной ценой
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onReject}
                            className="border-danger/50 text-danger hover:border-danger hover:text-danger"
                        >
                            Отклонить
                        </Button>
                    </>
                )}

                {is('confirmed') && (
                    <>
                        <Button
                            size="sm"
                            loading={form.processing}
                            onClick={() => advance('in_progress')}
                        >
                            Начать работу
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            loading={form.processing}
                            onClick={() => advance('done')}
                        >
                            Завершить
                        </Button>
                    </>
                )}

                {is('in_progress') && (
                    <Button
                        size="sm"
                        loading={form.processing}
                        onClick={() => advance('done')}
                    >
                        Завершить
                    </Button>
                )}

                {(is('done') || is('cancelled')) && (
                    <p className="text-xs text-text-secondary">
                        {is('done')
                            ? 'Визит завершён. Клиент может оставить отзыв.'
                            : 'Запись отменена или отклонена.'}
                    </p>
                )}

                {form.errors.status !== undefined && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {form.errors.status}
                    </p>
                )}
            </div>
        </article>
    );
}

/*
|--------------------------------------------------------------------------
| Confirm modal
|--------------------------------------------------------------------------
| Prefilled from the master's own price list for this service so the common
| case is one click. The two modes are separate because the backend stores
| either a range or a single offer, never both.
*/

function ConfirmAppointmentModal({
    appointment,
    mode,
    onClose,
}: {
    appointment: MasterAppointmentRow | null;
    mode: ConfirmMode;
    onClose: () => void;
}) {
    if (appointment === null) {
        return null;
    }

    return (
        <ConfirmForm
            key={`${appointment.id}-${mode}`}
            appointment={appointment}
            mode={mode}
            onClose={onClose}
        />
    );
}

interface ConfirmFormState {
    price_min: string;
    price_max: string;
    price_offer: string;
    master_comment: string;
}

function ConfirmForm({
    appointment,
    mode,
    onClose,
}: {
    appointment: MasterAppointmentRow;
    mode: ConfirmMode;
    onClose: () => void;
}) {
    const service = appointment.service;

    // Prefill from the catalogue range; the master narrows it as needed.
    const baseMin = service === undefined ? '' : String(service.base_price_min);
    const baseMax = service === undefined ? '' : String(service.base_price_max);

    const form = useForm<ConfirmFormState>({
        price_min: mode === 'range' ? baseMin : '',
        price_max: mode === 'range' ? baseMax : '',
        price_offer: mode === 'offer' ? baseMin : '',
        master_comment: '',
    });

    const [localError, setLocalError] = useState<string | null>(null);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (mode === 'range') {
            if (form.data.price_min === '' || form.data.price_max === '') {
                setLocalError('Заполните обе границы диапазона или используйте точную цену.');

                return;
            }

            if (Number(form.data.price_max) < Number(form.data.price_min)) {
                setLocalError('Максимальная цена не может быть меньше минимальной.');

                return;
            }
        } else if (form.data.price_offer === '') {
            setLocalError('Укажите точную цену.');

            return;
        }

        setLocalError(null);

        // Exactly one shape is sent: the request rejects both at once.
        form.transform((data) =>
            mode === 'range'
                ? {
                      price_min: data.price_min,
                      price_max: data.price_max,
                      master_comment: data.master_comment,
                  }
                : {
                      price_offer: data.price_offer,
                      master_comment: data.master_comment,
                  },
        );

        form.patch(routes.masterArea.appointmentConfirm(appointment.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="md"
            title={mode === 'range' ? 'Подтвердить с диапазоном' : 'Подтвердить с точной ценой'}
            description="Клиент увидит указанную стоимость в личном кабинете сразу после подтверждения."
        >
            <form onSubmit={submit} className="space-y-5" noValidate>
                <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm">
                    <p className="text-text-primary">{appointment.client?.name ?? 'Клиент'}</p>
                    <p className="mt-1 text-text-secondary">
                        {appointment.service?.name ?? 'Услуга'} · {appointment.starts_at_label ?? '—'}
                    </p>
                </div>

                {mode === 'range' ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Input
                            label="Цена от, ₽"
                            name="price_min"
                            type="number"
                            min={0}
                            step={50}
                            required
                            value={form.data.price_min}
                            error={form.errors.price_min}
                            onChange={(event) => form.setData('price_min', event.target.value)}
                        />

                        <Input
                            label="Цена до, ₽"
                            name="price_max"
                            type="number"
                            min={0}
                            step={50}
                            required
                            value={form.data.price_max}
                            error={form.errors.price_max}
                            onChange={(event) => form.setData('price_max', event.target.value)}
                        />
                    </div>
                ) : (
                    <Input
                        label="Точная цена, ₽"
                        name="price_offer"
                        type="number"
                        min={0}
                        step={50}
                        required
                        value={form.data.price_offer}
                        error={form.errors.price_offer}
                        onChange={(event) => form.setData('price_offer', event.target.value)}
                    />
                )}

                <Textarea
                    label="Комментарий клиенту"
                    name="master_comment"
                    rows={3}
                    maxLength={2000}
                    placeholder="Например: цена окончательная, доплата не потребуется"
                    value={form.data.master_comment}
                    error={form.errors.master_comment}
                    onChange={(event) => form.setData('master_comment', event.target.value)}
                />

                {localError !== null && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {localError}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row-reverse">
                    <Button type="submit" loading={form.processing} fullWidth className="sm:w-auto">
                        Подтвердить
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

/*
|--------------------------------------------------------------------------
| Reject modal
|--------------------------------------------------------------------------
| MasterAppointmentController@reject moves the booking to `cancelled` (freeing
| the slot). The comment is sent as `master_comment` so the client can read why.
*/

function RejectAppointmentModal({
    appointment,
    onClose,
}: {
    appointment: MasterAppointmentRow | null;
    onClose: () => void;
}) {
    if (appointment === null) {
        return null;
    }

    return <RejectForm appointment={appointment} onClose={onClose} />;
}

function RejectForm({
    appointment,
    onClose,
}: {
    appointment: MasterAppointmentRow;
    onClose: () => void;
}) {
    const form = useForm<{ master_comment: string }>({ master_comment: '' });
    const [localError, setLocalError] = useState<string | null>(null);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // The reason is not required by the backend, but rejecting without one
        // leaves the client guessing.
        if (form.data.master_comment.trim() === '') {
            setLocalError('Укажите причину — клиент увидит её в кабинете.');

            return;
        }

        setLocalError(null);

        form.patch(routes.masterArea.appointmentReject(appointment.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="sm"
            title="Отклонить запись?"
            description="Слот освободится и станет доступен другим клиентам."
        >
            <form onSubmit={submit} className="space-y-5" noValidate>
                <Textarea
                    label="Причина отказа"
                    name="master_comment"
                    rows={3}
                    maxLength={2000}
                    required
                    placeholder="Например: это время уже занято другой записью"
                    value={form.data.master_comment}
                    error={form.errors.master_comment}
                    onChange={(event) => form.setData('master_comment', event.target.value)}
                />

                {localError !== null && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {localError}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row-reverse">
                    <Button
                        type="submit"
                        loading={form.processing}
                        fullWidth
                        className="border-danger/50 text-danger hover:border-danger hover:text-danger sm:w-auto"
                        variant="ghost"
                    >
                        Отклонить
                    </Button>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={onClose}
                        disabled={form.processing}
                        fullWidth
                        className="sm:w-auto"
                    >
                        Оставить заявку
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function emptyTitle(tab: TabId): string {
    switch (tab) {
        case 'pending':
            return 'Новых заявок нет';
        case 'confirmed':
            return 'Подтверждённых записей нет';
        case 'done':
            return 'Завершённых визитов нет';
        case 'cancelled':
            return 'Отменённых записей нет';
        default:
            return 'Записей нет';
    }
}

function emptyText(tab: TabId): ReactNode {
    switch (tab) {
        case 'pending':
            return 'Как только клиент запишется, заявка появится здесь.';
        case 'confirmed':
            return 'Подтвердите заявку, и она появится в этом списке.';
        case 'done':
            return 'Завершённые визиты будут накапливаться здесь.';
        case 'cancelled':
            return 'Отклонённые и отменённые записи — здесь.';
        default:
            return 'Проверьте другой фильтр.';
    }
}
