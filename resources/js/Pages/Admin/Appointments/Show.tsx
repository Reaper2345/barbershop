import { Head, Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Badge, StatusBadge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Lightbox, type LightboxPhoto } from '@/Components/UI/Lightbox';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { formatDuration } from '@/lib/format';
import { masterName, priceState } from '@/types';
import type { CabinetAppointment, StatusOption } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Appointments/Show — GET /admin/appointments/{appointment}
|--------------------------------------------------------------------------
| Admin\AppointmentController@show renders this page, but no such page file
| existed, so the route 500'd with:
|   Page not found: ./Pages/Admin/Appointments/Show.tsx
|
| It is the read-only counterpart to the list's inline modal: booking facts, the
| client's comment, the reference photo and the review. Status changes stay in
| the list modal (and the PATCH endpoint), so this page only reports.
*/

export interface AdminAppointmentShowProps {
    appointment: CabinetAppointment;
    statuses?: StatusOption[];
}

export default function AdminAppointmentShow({
    appointment,
    statuses = [],
}: AdminAppointmentShowProps) {
    const price = priceState(appointment);
    const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);

    return (
        <AdminLayout
            title={`Запись #${appointment.id}`}
            subtitle={appointment.starts_at_label ?? undefined}
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: PANEL.admin.appointmentsTitle, href: routes.admin.appointments() },
                { label: `#${appointment.id}` },
            ]}
            actions={
                <Button href={routes.admin.appointments()} variant="ghost">
                    {PANEL.common.back}
                </Button>
            }
        >
            <Head title={`Запись #${appointment.id}`} />

            <dl className="grid gap-4 rounded-2xl border border-border bg-bg-elevated p-6 sm:grid-cols-2">
                <Row label="Статус" value={<StatusBadge status={appointment.status} />} />
                <Row label="Дата и время" value={appointment.starts_at_label ?? '—'} />
                <Row label="Клиент" value={appointment.client?.name ?? '—'} />
                <Row label="Телефон" value={appointment.client?.phone ?? '—'} />
                <Row label="Email" value={appointment.client?.email ?? '—'} />
                <Row label="Мастер" value={masterName(appointment.master)} />
                <Row label="Услуга" value={appointment.service?.name ?? '—'} />
                <Row
                    label="Длительность"
                    value={
                        appointment.duration_min === null || appointment.duration_min === undefined
                            ? '—'
                            : formatDuration(appointment.duration_min)
                    }
                />
                <Row
                    label="Стоимость"
                    value={
                        price.kind === 'pending' ? (
                            <span className="text-text-secondary">уточняется</span>
                        ) : (
                            <span className="text-accent">
                                {price.kind === 'offer' ? 'Подтверждено: ' : 'Диапазон: '}
                                {price.label}
                            </span>
                        )
                    }
                />
                <Row label="Создана" value={appointment.created_at ?? '—'} />
            </dl>

            {appointment.client_comment !== null && appointment.client_comment !== '' && (
                <section className="mt-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <h2 className="text-xs uppercase tracking-wider text-text-secondary">
                        Комментарий клиента
                    </h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-primary">
                        {appointment.client_comment}
                    </p>
                </section>
            )}

            {appointment.master_comment !== null && appointment.master_comment !== '' && (
                <section className="mt-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <h2 className="text-xs uppercase tracking-wider text-text-secondary">
                        Комментарий мастера
                    </h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-primary">
                        {appointment.master_comment}
                    </p>
                </section>
            )}

            {appointment.photo_url != null && appointment.photo_url !== '' && (
                <section className="mt-6">
                    <h2 className="mb-3 text-xs uppercase tracking-wider text-text-secondary">
                        Фото-референс
                    </h2>
                    <button
                        type="button"
                        onClick={() =>
                            setLightbox({
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
                            className="h-64 w-auto object-cover"
                            loading="lazy"
                        />
                    </button>
                </section>
            )}

            {/* Review, when one exists */}
            {(appointment.review ?? null) !== null && (
                <section className="mt-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xs uppercase tracking-wider text-text-secondary">
                            Отзыв клиента
                        </h2>
                        <Badge tone={appointment.review?.is_approved === true ? 'emerald' : 'amber'} dot>
                            {appointment.review?.is_approved === true
                                ? 'Опубликован'
                                : 'На модерации'}
                        </Badge>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-primary">
                        {appointment.review?.text ?? 'Без текста'}
                    </p>
                </section>
            )}

            <p className="mt-8 text-xs text-text-secondary">
                Доступные статусы: {statuses.map((status) => status.label).join(', ') || '—'}.
                Изменение статуса выполняется из списка записей.
            </p>

            <Link
                href={routes.admin.appointments()}
                className="mt-4 inline-block text-sm text-accent transition-all duration-300 hover:text-accent-hover"
            >
                ← Вернуться к списку записей
            </Link>

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

function Row({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wider text-text-secondary">{label}</dt>
            <dd className="mt-1 text-sm text-text-primary">{value}</dd>
        </div>
    );
}
