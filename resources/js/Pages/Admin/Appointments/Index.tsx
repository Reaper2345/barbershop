import { useState, type FormEvent, type ReactNode } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Select } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { Modal } from '@/Components/UI/Modal';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { StatusBadge } from '@/Components/UI/Badge';
import { AlertIcon, PhoneIcon, QuoteIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL, STATUS_OPTIONS } from '@/lib/panel-copy';
import { formatDuration } from '@/lib/format';
import { priceState, masterName } from '@/types';
import type { CabinetAppointment, StatusOption } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Appointments/Index — GET /admin/appointments
|--------------------------------------------------------------------------
| Every booking in the system, with the brief's filters: status, master, date
| and client search.
|
| The controller supports `status`, `master_id` and `date` server-side. Client
| search is applied in the browser over the returned page, because the
| controller query does not filter on the client — noted here rather than
| silently pretending otherwise.
|
| Actions: view details (modal), change status, cancel.
*/

export interface AdminAppointmentsIndexProps {
    appointments?: CabinetAppointment[];
    appointments_meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    appointments_links?: {
        first: string | null;
        prev: string | null;
        next: string | null;
        last: string | null;
    };
    masters?: Array<{ id: number; user?: { name: string } }>;
    statuses?: StatusOption[];
    filters?: {
        status?: string;
        master_id?: number | null;
        date?: string;
        /** Allow-listed sort key echoed by the controller. */
        sort?: string | null;
        dir?: 'asc' | 'desc';
    };
}

/** Column key → the controller's sort allow-list key. */
const SORT_KEYS: Record<string, string> = {
    date: 'starts_at',
    created: 'created_at',
    // Must be the COLUMN key ('price'), not the controller's allow-list key:
    // handleSort() looks the column up here and bails on undefined, so a
    // mismatch silently downgraded "Стоимость" to client-side sorting.
    price: 'cost',
    status: 'status',
};

export default function AdminAppointmentsIndex({
    appointments = [],
    appointments_meta,
    appointments_links,
    masters = [],
    statuses = STATUS_OPTIONS,
    filters,
}: AdminAppointmentsIndexProps) {
    const [detail, setDetail] = useState<CabinetAppointment | null>(null);
    /** Reference-photo viewer, one per page. */
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);
    const [clientSearch, setClientSearch] = useState('');

    /** Client-side search over the current page (the API does not support it). */
    const needle = clientSearch.trim().toLowerCase();
    const rows =
        needle === ''
            ? appointments
            : appointments.filter((row) => {
                  const name = row.client?.name?.toLowerCase() ?? '';
                  const phone = (row.client?.phone ?? '').replace(/[^\d]/g, '');
                  const digits = needle.replace(/[^\d]/g, '');

                  return (
                      name.includes(needle) ||
                      (digits !== '' && phone.includes(digits)) ||
                      (row.client?.email ?? '').toLowerCase().includes(needle)
                  );
              });

    /*
     * Server-side sorting.
     *
     * Sorting happens in the database, not in the browser: the list is paginated
     * at 25 rows, so a client-side sort would only reorder the current page while
     * the header implied a sort over the whole set. The controller applies an
     * allow-listed column, so the sort key here maps to a known identifier.
     */
    const serverSort = filters?.sort ?? null;
    const serverDir = filters?.dir ?? 'desc';

    const handleSort = (column: string, direction: 'asc' | 'desc'): void => {
        const key = SORT_KEYS[column];

        if (key === undefined) {
            return;
        }

        router.get(
            routes.admin.appointments({
                status: filters?.status ?? '',
                masterId: filters?.master_id ?? '',
                date: filters?.date ?? '',
                sort: key,
                dir: direction,
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    /** Maps the controller's sort key back onto the table's column key. */
    const activeColumn =
        serverSort === null
            ? null
            : (Object.keys(SORT_KEYS).find((key) => SORT_KEYS[key] === serverSort) ?? null);

    const columns: Array<DataTableColumn<CabinetAppointment>> = [
        {
            key: 'date',
            header: 'Дата и время',
            sortable: true,
            accessor: (row) => row.starts_at,
            render: (row) => (
                <span className="whitespace-nowrap">
                    <span className="block text-text-primary">{row.date_label ?? '—'}</span>
                    <span className="text-xs tabular-nums text-text-secondary">
                        {row.time_label ?? ''}
                        {row.duration_min !== null && row.duration_min !== undefined && row.duration_min > 0
                            ? ` · ${formatDuration(row.duration_min)}`
                            : ''}
                    </span>
                </span>
            ),
        },
        {
            key: 'client',
            header: 'Клиент',
            sortable: true,
            accessor: (row) => row.client?.name,
            render: (row) => (
                <span>
                    <span className="block text-text-primary">{row.client?.name ?? '—'}</span>
                    {row.client?.phone !== null && row.client?.phone !== undefined && (
                        <span className="text-xs text-text-secondary">{row.client.phone}</span>
                    )}
                </span>
            ),
        },
        {
            key: 'master',
            header: 'Мастер',
            sortable: true,
            // AppointmentResource flattens the master name (MasterResource),
            // so it is not nested under `user` here.
            accessor: (row) => masterName(row.master),
            render: (row) => (
                <span className="text-text-secondary">{masterName(row.master)}</span>
            ),
        },
        {
            key: 'service',
            header: 'Услуга',
            sortable: true,
            accessor: (row) => row.service?.name,
            render: (row) => row.service?.name ?? '—',
        },
        {
            key: 'status',
            header: 'Статус',
            sortable: true,
            accessor: (row) => row.status,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'price',
            header: 'Стоимость',
            // Sorts server-side on COALESCE(master_price_offer, master_price_min, 0):
            // an exact offer wins, then the bottom of the quoted range, matching
            // the badge shown in the cell.
            sortable: true,
            align: 'right',
            accessor: (row) => row.master_price_offer ?? row.master_price_min ?? 0,
            render: (row) => <PriceCell appointment={row} />,
        },
        {
            key: 'actions',
            header: PANEL.common.actions,
            align: 'right',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setDetail(row)}>
                    Подробнее
                </Button>
            ),
        },
    ];

    const applyFilters = (next: {
        status?: string;
        masterId?: number | string;
        date?: string;
    }): void => {
        router.get(
            routes.admin.appointments({
                status: next.status ?? filters?.status ?? '',
                masterId: next.masterId ?? filters?.master_id ?? '',
                date: next.date ?? filters?.date ?? '',
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AdminLayout
            title={PANEL.admin.appointmentsTitle}
            subtitle="Все записи с фильтрами по статусу, мастеру и дате."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Записи' },
            ]}
        >
            <Head title={PANEL.admin.appointmentsTitle} />

            {/* Filters */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Select
                    label="Статус"
                    name="status"
                    value={filters?.status ?? ''}
                    options={statuses.map((status) => ({
                        value: status.value,
                        label: status.label,
                    }))}
                    placeholder="Все статусы"
                    onChange={(event) => applyFilters({ status: event.target.value })}
                />

                <Select
                    label="Мастер"
                    name="master_id"
                    value={filters?.master_id === null || filters?.master_id === undefined ? '' : String(filters.master_id)}
                    options={masters.map((master) => ({
                        value: master.id,
                        label: master.user?.name ?? `Мастер #${master.id}`,
                    }))}
                    placeholder="Все мастера"
                    onChange={(event) => applyFilters({ masterId: event.target.value })}
                />

                <Input
                    label="Дата"
                    name="date"
                    type="date"
                    value={filters?.date ?? ''}
                    onChange={(event) => applyFilters({ date: event.target.value })}
                />

                <Input
                    label="Поиск клиента"
                    name="client_search"
                    type="search"
                    placeholder="Имя, телефон или email"
                    value={clientSearch}
                    hint="Ищет среди записей текущей страницы"
                    onChange={(event) => setClientSearch(event.target.value)}
                />
            </div>

            <DataTable
                caption={PANEL.admin.appointmentsTitle}
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                meta={appointments_meta}
                links={appointments_links}
                // Server mode: `sort` mirrors the controller's allow-listed key
                // so the active column header shows the right arrow.
                sort={activeColumn}
                direction={serverDir}
                onSort={handleSort}
                empty="Записей не найдено"
                onRowClick={(row) => setDetail(row)}
            />

            <AppointmentDetailModal
                appointment={detail}
                onClose={() => setDetail(null)}
                onPhotoClick={setLightbox}
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

/** Price with the three states the schema can express. */
function PriceCell({ appointment }: { appointment: CabinetAppointment }) {
    const price = priceState(appointment);

    if (price.kind === 'pending') {
        return <span className="text-xs text-text-secondary">уточняется</span>;
    }

    return (
        <span className="whitespace-nowrap tabular-nums text-accent">
            {price.kind === 'offer' ? price.label : `${price.label}`}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Detail modal
|--------------------------------------------------------------------------
| Full record plus the two admin mutations: change status (with an optional
| comment) and cancel.
*/

export function AppointmentDetailModal({
    appointment,
    onClose,
    onPhotoClick,
}: {
    appointment: CabinetAppointment | null;
    onClose: () => void;
    onPhotoClick: (photo: LightboxPhoto) => void;
}) {
    if (appointment === null) {
        return null;
    }

    return (
        <AppointmentDetailForm
            key={appointment.id}
            appointment={appointment}
            onClose={onClose}
            onPhotoClick={onPhotoClick}
        />
    );
}

function AppointmentDetailForm({
    appointment,
    onClose,
    onPhotoClick,
}: {
    appointment: CabinetAppointment;
    onClose: () => void;
    onPhotoClick: (photo: LightboxPhoto) => void;
}) {
    const [status, setStatus] = useState(appointment.status);
    const [comment, setComment] = useState(appointment.master_comment ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = (nextStatus: string, withComment: boolean): void => {
        setError(null);
        setProcessing(true);

        router.patch(
            routes.admin.appointment(appointment.id),
            {
                status: nextStatus,
                ...(withComment ? { master_comment: comment } : {}),
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setError(errors.status ?? 'Не удалось изменить статус.');
                },
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (status === appointment.status && comment === (appointment.master_comment ?? '')) {
            setError('Статус и комментарий не изменились.');

            return;
        }

        save(status, true);
    };

    const price = priceState(appointment);

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={`Запись #${appointment.id}`}
            description={appointment.starts_at_label ?? undefined}
        >
            <div className="space-y-6">
                {/* Read-only facts */}
                <dl className="grid gap-4 rounded-2xl border border-border bg-bg-secondary p-5 sm:grid-cols-2">
                    <Detail label="Клиент" value={appointment.client?.name ?? '—'} />
                    <Detail
                        label="Телефон"
                        value={
                            appointment.client?.phone !== null && appointment.client?.phone !== undefined ? (
                                <a
                                    href={`tel:${appointment.client.phone.replace(/[^\d+]/g, '')}`}
                                    className="inline-flex items-center gap-1.5 text-accent transition-all duration-300 hover:text-accent-hover"
                                >
                                    <PhoneIcon className="h-3.5 w-3.5" />
                                    {appointment.client.phone}
                                </a>
                            ) : (
                                '—'
                            )
                        }
                    />
                    <Detail label="Мастер" value={masterName(appointment.master)} />
                    <Detail label="Услуга" value={appointment.service?.name ?? '—'} />
                    <Detail
                        label="Длительность"
                        value={
                            appointment.duration_min !== null && appointment.duration_min !== undefined
                                ? formatDuration(appointment.duration_min)
                                : '—'
                        }
                    />
                    <Detail
                        label="Стоимость"
                        value={
                            price.kind === 'pending' ? (
                                <span className="text-text-secondary">уточняется</span>
                            ) : (
                                <span className="text-accent">{price.label}</span>
                            )
                        }
                    />
                    <Detail
                        label="Текущий статус"
                        value={<StatusBadge status={appointment.status} />}
                    />
                    <Detail
                        label="Создана"
                        value={appointment.created_at ?? '—'}
                    />
                </dl>

                {/* Client's comment */}
                {appointment.client_comment !== null && appointment.client_comment !== '' && (
                    <div className="rounded-2xl border border-border bg-bg-elevated p-5">
                        <p className="text-xs uppercase tracking-wider text-text-secondary">
                            Комментарий клиента
                        </p>
                        <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
                            <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent/60" />
                            {appointment.client_comment}
                        </p>
                    </div>
                )}

                {/* Reference photo */}
                {appointment.photo_url != null && appointment.photo_url !== '' && (
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">
                            Фото-референс
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
                                className="h-48 w-auto object-cover"
                                loading="lazy"
                            />
                        </button>
                    </div>
                )}

                {/* Status change */}
                <form onSubmit={submit} className="space-y-5 border-t border-border pt-6">
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                        Изменение статуса
                    </h3>

                    <Select
                        label="Новый статус"
                        name="status"
                        value={status}
                        options={STATUS_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                        }))}
                        onChange={(event) => setStatus(event.target.value as CabinetAppointment['status'])}
                    />

                    <Textarea
                        label="Комментарий мастера"
                        name="master_comment"
                        rows={3}
                        maxLength={2000}
                        placeholder="Клиент увидит этот текст в личном кабинете"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                    />

                    {error !== null && (
                        <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                            <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                            {error}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row-reverse">
                        <Button type="submit" loading={processing} fullWidth className="sm:w-auto">
                            {PANEL.common.save}
                        </Button>

                        {appointment.status !== 'cancelled' && (
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={processing}
                                onClick={() => save('cancelled', false)}
                                fullWidth
                                className="border-danger/50 text-danger hover:border-danger hover:text-danger sm:w-auto"
                            >
                                Отменить запись
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={processing}
                            fullWidth
                            className="sm:w-auto"
                        >
                            {PANEL.common.cancel}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wider text-text-secondary">{label}</dt>
            <dd className="mt-1 text-sm text-text-primary">{value}</dd>
        </div>
    );
}
