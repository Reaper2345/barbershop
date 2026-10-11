import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { StatCard } from '@/Components/Admin/StatCard';
import { Button } from '@/Components/UI/Button';
import { StatusBadge } from '@/Components/UI/Badge';
import { RatingStars } from '@/Components/UI/RatingStars';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AlertIcon, CalendarIcon, StarIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { formatPrice } from '@/lib/format';
import { PANEL } from '@/lib/panel-copy';
import { cn } from '@/lib/format';
import type {
    AdminDashboardStats,
    AdminMetricRow,
    AdminRecentAppointmentRow,
    AdminTopMasterRow,
} from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Dashboard — GET /admin
|--------------------------------------------------------------------------
| Three tables, as the brief requires (not a wall of cards):
|
|   1. Метрики — | Метрика | Сегодня | Неделя | Месяц | Всего |
|   2. Топ-5 мастеров — name, bookings, revenue, rating
|   3. Последние 10 записей — date, client, master, service, status, price
|
| Props: `stats` (counters + the `metrics` rows), `topMasters`,
| `recentAppointments`.
*/

export interface AdminDashboardProps {
    stats?: AdminDashboardStats;
    topMasters?: AdminTopMasterRow[];
    recentAppointments?: AdminRecentAppointmentRow[];
}

export default function AdminDashboard({
    stats = {},
    topMasters = [],
    recentAppointments = [],
}: AdminDashboardProps) {
    const metrics = stats.metrics ?? [];

    // Sort state is per table, since each is sorted independently.
    const [masterSort, setMasterSort] = useState<string | null>(null);
    const [masterDir, setMasterDir] = useState<'asc' | 'desc'>('desc');
    const [recentSort, setRecentSort] = useState<string | null>(null);
    const [recentDir, setRecentDir] = useState<'asc' | 'desc'>('desc');

    const pendingAppointments = stats.appointments_pending ?? 0;
    const pendingReviews = stats.reviews_pending ?? 0;

    return (
        <AdminLayout
            title={PANEL.admin.dashboardTitle}
            subtitle={PANEL.admin.dashboardSubtitle}
            nav={buildAdminNav({
                masters: stats.masters_total,
                services: stats.services_total,
                categories: stats.categories_total,
                appointmentsPending: pendingAppointments,
                reviewsPending: pendingReviews,
                pages: stats.pages_total,
                users: stats.users_total,
            })}
            breadcrumbs={[{ label: 'Панель управления' }]}
            notificationCount={pendingReviews + pendingAppointments}
            actions={
                <>
                    <Button href={routes.admin.appointments({ status: 'pending' })} variant="ghost">
                        Новые записи
                        {pendingAppointments > 0 && (
                            <span className="ml-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                                {pendingAppointments}
                            </span>
                        )}
                    </Button>
                    <Button href={routes.admin.reviews('no')} variant="ghost">
                        Отзывы на модерации
                        {pendingReviews > 0 && (
                            <span className="ml-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                                {pendingReviews}
                            </span>
                        )}
                    </Button>
                </>
            }
        >
            <Head title={PANEL.admin.dashboardTitle} />

            {/* Attention banner */}
            {(pendingAppointments > 0 || pendingReviews > 0) && (
                <div
                    role="status"
                    className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-accent/50 bg-accent/10 px-5 py-4"
                >
                    <AlertIcon className="h-5 w-5 shrink-0 text-accent" />

                    <p className="min-w-0 flex-1 text-sm text-text-primary">
                        Требуют внимания:{' '}
                        {pendingAppointments > 0 && (
                            <Link
                                href={routes.admin.appointments({ status: 'pending' })}
                                className="font-medium text-accent underline underline-offset-4"
                            >
                                {pendingAppointments} {plural(pendingAppointments, 'заявка', 'заявки', 'заявок')}
                            </Link>
                        )}
                        {pendingAppointments > 0 && pendingReviews > 0 && ' и '}
                        {pendingReviews > 0 && (
                            <Link
                                href={routes.admin.reviews('no')}
                                className="font-medium text-accent underline underline-offset-4"
                            >
                                {pendingReviews} {plural(pendingReviews, 'отзыв', 'отзыва', 'отзывов')}
                            </Link>
                        )}
                        .
                    </p>
                </div>
            )}

            {/* ------------------------------------------------------------
                Table 1 — key metrics
            ------------------------------------------------------------ */}
            <section aria-labelledby="metrics-heading">
                <h2
                    id="metrics-heading"
                    className="mb-4 font-display text-xl font-semibold text-text-primary"
                >
                    {PANEL.admin.metricsTitle}
                </h2>

                <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[36rem] border-collapse text-sm">
                            <caption className="sr-only">
                                Ключевые метрики за сегодня, неделю, месяц и всё время
                            </caption>

                            <thead>
                                <tr className="border-b border-border bg-bg-secondary text-xs uppercase tracking-wider text-text-secondary">
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Метрика
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right">
                                        Сегодня
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right">
                                        Неделя
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right">
                                        Месяц
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right">
                                        Всего
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {metrics.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-text-secondary"
                                        >
                                            Метрики недоступны
                                        </td>
                                    </tr>
                                ) : (
                                    metrics.map((metric) => (
                                        <MetricRow key={metric.key} metric={metric} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------------------
                Table 2 — top masters
            ------------------------------------------------------------ */}
            <section className="mt-12" aria-labelledby="top-masters-heading">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                    <h2
                        id="top-masters-heading"
                        className="font-display text-xl font-semibold text-text-primary"
                    >
                        {PANEL.admin.topMastersTitle}
                    </h2>

                    <Link
                        href={routes.admin.masters}
                        className="text-sm text-accent transition-all duration-300 hover:text-accent-hover"
                    >
                        Все мастера →
                    </Link>
                </div>

                {topMasters.length === 0 ? (
                    <EmptyState
                        size="sm"
                        icon={<StarIcon />}
                        title="Мастеров пока нет"
                        description="Добавьте первого мастера, чтобы видеть статистику."
                        action={<Button href={routes.admin.mastersCreate}>Добавить мастера</Button>}
                    />
                ) : (
                    <DataTable
                        caption={PANEL.admin.topMastersTitle}
                        columns={topMasterColumns}
                        rows={
                            masterSort === null
                                ? topMasters
                                : [...topMasters].sort((a, b) => {
                                      const pick = (row: AdminTopMasterRow): string | number => {
                                          switch (masterSort) {
                                              case 'name':
                                                  return row.name;
                                              case 'appointments':
                                                  return row.appointments_count;
                                              case 'revenue':
                                                  return row.revenue;
                                              case 'rating':
                                                  return row.rating;
                                              default:
                                                  return 0;
                                          }
                                      };

                                      const left = pick(a);
                                      const right = pick(b);

                                      const comparison =
                                          typeof left === 'number' && typeof right === 'number'
                                              ? left - right
                                              : String(left).localeCompare(String(right), 'ru');

                                      return masterDir === 'asc' ? comparison : -comparison;
                                  })
                        }
                        rowKey={(row) => row.id}
                        sort={masterSort}
                        direction={masterDir}
                        onSort={(column, dir) => {
                            setMasterSort(column);
                            setMasterDir(dir);
                        }}
                    />
                )}
            </section>

            {/* ------------------------------------------------------------
                Table 3 — latest appointments
            ------------------------------------------------------------ */}
            <section className="mt-12" aria-labelledby="recent-heading">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                    <h2
                        id="recent-heading"
                        className="font-display text-xl font-semibold text-text-primary"
                    >
                        {PANEL.admin.recentTitle}
                    </h2>

                    <Link
                        href={routes.admin.appointments()}
                        className="text-sm text-accent transition-all duration-300 hover:text-accent-hover"
                    >
                        Все записи →
                    </Link>
                </div>

                {recentAppointments.length === 0 ? (
                    <EmptyState
                        size="sm"
                        icon={<CalendarIcon />}
                        title="Записей пока нет"
                        description="Как только клиенты начнут записываться, заявки появятся здесь."
                    />
                ) : (
                    <DataTable
                        caption={PANEL.admin.recentTitle}
                        columns={recentColumns}
                        rows={
                            recentSort === null
                                ? recentAppointments
                                : [...recentAppointments].sort((a, b) => {
                                      const pick = (row: AdminRecentAppointmentRow): string | number => {
                                          switch (recentSort) {
                                              case 'date':
                                                  return row.starts_at ?? '';
                                              case 'client':
                                                  return row.client?.name ?? '';
                                              case 'master':
                                                  return row.master?.name ?? '';
                                              case 'service':
                                                  return row.service?.name ?? '';
                                              case 'status':
                                                  return row.status;
                                              default:
                                                  return 0;
                                          }
                                      };

                                      const left = pick(a);
                                      const right = pick(b);

                                      const comparison =
                                          typeof left === 'number' && typeof right === 'number'
                                              ? left - right
                                              : String(left).localeCompare(String(right), 'ru');

                                      return recentDir === 'asc' ? comparison : -comparison;
                                  })
                        }
                        rowKey={(row) => row.id}
                        sort={recentSort}
                        direction={recentDir}
                        onSort={(column, dir) => {
                            setRecentSort(column);
                            setRecentDir(dir);
                        }}
                    />
                )}
            </section>
        </AdminLayout>
    );
}

/* ------------------------------------------------------------------ */
/* Metric row                                                          */
/* ------------------------------------------------------------------ */

function MetricRow({ metric }: { metric: AdminMetricRow }) {
    const format = (value: number): string =>
        metric.format === 'money' ? formatPrice(value) : String(value);

    const tone =
        metric.tone === 'accent'
            ? 'text-accent'
            : metric.tone === 'danger'
              ? 'text-danger'
              : metric.tone === 'success'
                ? 'text-success'
                : 'text-text-primary';

    return (
        <tr className="border-b border-border/60 transition-colors duration-200 last:border-b-0 hover:bg-bg-secondary">
            <th scope="row" className="px-4 py-4 text-left font-medium text-text-primary">
                {metric.label}
            </th>

            {[metric.today, metric.week, metric.month, metric.total].map((value, index) => (
                <td key={index} className="px-4 py-4">
                    <StatCard
                        variant="plain"
                        label={metric.label}
                        value={format(value)}
                        tone={metric.tone ?? 'neutral'}
                        className={index === 3 ? cn('[&_p]:text-base', tone) : undefined}
                    />
                </td>
            ))}
        </tr>
    );
}

/* ------------------------------------------------------------------ */
/* Column definitions                                                  */
/* ------------------------------------------------------------------ */

const topMasterColumns: Array<DataTableColumn<AdminTopMasterRow>> = [
    {
        key: 'name',
        header: 'Мастер',
        sortable: true,
        accessor: (row) => row.name,
        render: (row) => (
            <Link
                href={routes.admin.masterEdit(row.id)}
                className="text-text-primary transition-all duration-300 hover:text-accent"
            >
                {row.name}
            </Link>
        ),
    },
    {
        key: 'appointments',
        header: 'Записей',
        sortable: true,
        align: 'right',
        accessor: (row) => row.appointments_count,
        render: (row) => <span className="tabular-nums">{row.appointments_count}</span>,
    },
    {
        key: 'revenue',
        header: 'Выручка',
        sortable: true,
        align: 'right',
        accessor: (row) => row.revenue,
        render: (row) => (
            <span className="tabular-nums text-accent">{formatPrice(row.revenue)}</span>
        ),
    },
    {
        key: 'rating',
        header: 'Рейтинг',
        sortable: true,
        align: 'right',
        accessor: (row) => row.rating,
        render: (row) => <RatingStars value={row.rating} size="sm" />,
    },
];

const recentColumns: Array<DataTableColumn<AdminRecentAppointmentRow>> = [
    {
        key: 'date',
        header: 'Дата',
        sortable: true,
        accessor: (row) => row.starts_at,
        render: (row) => (
            <span className="whitespace-nowrap">
                <span className="block text-text-primary">{row.date_label ?? '—'}</span>
                <span className="text-xs text-text-secondary tabular-nums">
                    {row.time_label ?? ''}
                </span>
            </span>
        ),
    },
    {
        key: 'client',
        header: 'Клиент',
        sortable: true,
        accessor: (row) => row.client?.name,
        render: (row) => row.client?.name ?? '—',
    },
    {
        key: 'master',
        header: 'Мастер',
        sortable: true,
        accessor: (row) => row.master?.name,
        render: (row) => row.master?.name ?? '—',
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
        align: 'right',
        render: (row) =>
            row.price_label === null ? (
                <span className="text-text-secondary">уточняется</span>
            ) : (
                <span className="tabular-nums text-accent">{row.price_label}</span>
            ),
    },
    {
        key: 'actions',
        header: '',
        align: 'right',
        /*
         * A real Inertia <Link>, not <Button href>.
         *
         * <Button> renders a <Link> only when it is not disabled and not
         * loading, and it spreads button props onto the anchor; inside a table
         * row that made the click a no-op. This anchor owns its own styling and
         * navigates to the appointment detail page
         * (GET /admin/appointments/{id} → Admin\AppointmentController@show).
         */
        render: (row) => (
            <Link
                href={routes.admin.appointment(row.id)}
                aria-label={`Открыть запись №${row.id}`}
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
            >
                Открыть
            </Link>
        ),
    },
];

function plural(count: number, one: string, few: string, many: string): string {
    const mod100 = count % 100;
    const mod10 = count % 10;

    if (mod100 > 10 && mod100 < 20) {
        return many;
    }

    if (mod10 === 1) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4) {
        return few;
    }

    return many;
}
