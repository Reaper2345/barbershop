import { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { StatCard } from '@/Components/Admin/StatCard';
import { DataTable, type DataTableColumn } from '@/Components/Admin/DataTable';
import { Button } from '@/Components/UI/Button';
import { StatusBadge } from '@/Components/UI/Badge';
import { EmptyState } from '@/Components/UI/EmptyState';
import { RatingStars } from '@/Components/UI/RatingStars';
import { AlertIcon, CalendarIcon, ClockIcon, ScissorsIcon, StarIcon } from '@/lib/icons';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { formatDuration, formatPrice } from '@/lib/format';
import { MASTER_COPY } from '@/lib/content';
import type { MasterScheduleDay, MasterAppointmentRow, MasterDashboardStats, SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Dashboard — GET /master/dashboard
|--------------------------------------------------------------------------
| Props from MasterDashboardController@index:
|   stats               today/week/revenue/review counters
|   todayAppointments   today's bookings, ordered by start time
|   schedules           the master's active weekdays
|
| The "Ближайшие записи" table is fed by todayAppointments. The alert banner
| appears whenever confirmations are waiting, because an unconfirmed booking is
| the one item that actively blocks a client.
*/

export interface MasterDashboardProps {
    stats?: MasterDashboardStats;
    todayAppointments?: MasterAppointmentRow[];
    schedules?: MasterScheduleDay[];
    /** Raw storage path; null/empty ⇒ the public card shows a placeholder. */
    photo?: string | null;
}

const WEEKDAYS = [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
];

export default function MasterDashboard({
    stats = {},
    todayAppointments = [],
    schedules = [],
    photo = null,
}: MasterDashboardProps) {
    const { auth, siteSettings } = usePage<SharedProps>().props;
    const masterName = auth.user?.name ?? 'мастер';
    /*
     * "Здравствуйте, Иван Соколов" read oddly and, at 30px, pushed the two
     * header buttons onto a second line below 1280. A greeting takes the first
     * name; the full name is right there in the top bar.
     */
    const greetingName = masterName.split(' ')[0] ?? masterName;

    const [sort, setSort] = useState<string | null>(null);
    const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

    /** Client-side sorting: the day's queue is small and fully loaded. */
    const rows = useMemo(() => {
        if (sort === null) {
            return todayAppointments;
        }

        const value = (row: MasterAppointmentRow): string | number => {
            switch (sort) {
                case 'time':
                    return row.starts_at ?? '';
                case 'client':
                    return row.client?.name ?? '';
                case 'service':
                    return row.service?.name ?? '';
                case 'status':
                    return row.status;
                default:
                    return '';
            }
        };

        return [...todayAppointments].sort((a, b) => {
            const left = value(a);
            const right = value(b);

            const comparison =
                typeof left === 'number' && typeof right === 'number'
                    ? left - right
                    : String(left).localeCompare(String(right), 'ru');

            return direction === 'asc' ? comparison : -comparison;
        });
    }, [todayAppointments, sort, direction]);

    const pending = stats.pending ?? 0;
    const todayTotal = stats.today_total ?? 0;
    const weekTotal = stats.week_total ?? 0;
    const revenue = stats.week_revenue ?? null;

    const columns: Array<DataTableColumn<MasterAppointmentRow>> = [
        {
            key: 'time',
            header: 'Время',
            sortable: true,
            accessor: (row) => row.starts_at,
            render: (row) => (
                <span className="whitespace-nowrap tabular-nums">
                    {row.time_label ?? formatTime(row.starts_at)}
                    {row.duration_min !== null && row.duration_min !== undefined && row.duration_min > 0 && (
                        <span className="ml-2 text-xs text-text-secondary">
                            {formatDuration(row.duration_min)}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'client',
            header: 'Клиент',
            sortable: true,
            accessor: (row) => row.client?.name,
            render: (row) => (
                <span className="block max-w-[16rem]">
                    <span className="block text-text-primary">{row.client?.name ?? '—'}</span>
                    {row.client?.phone !== null && row.client?.phone !== undefined && (
                        <a
                            href={`tel:${row.client.phone.replace(/[^\d+]/g, '')}`}
                            className="text-xs text-text-secondary transition-all duration-300 hover:text-accent"
                        >
                            {row.client.phone}
                        </a>
                    )}

                    {/* What the client asked for — the master needs it before
                        the visit, not after opening the detail modal. */}
                    {row.client_comment !== null && row.client_comment !== '' && (
                        <span className="mt-1 block text-xs italic leading-relaxed text-text-secondary">
                            {row.client_comment}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'service',
            header: 'Услуга',
            sortable: true,
            accessor: (row) => row.service?.name,
            render: (row) => (
                <span className="block max-w-[18rem]">
                    <span className="block text-text-primary">{row.service?.name ?? '—'}</span>
                    {row.service?.description !== null &&
                        row.service?.description !== undefined &&
                        row.service.description !== '' && (
                            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                                {row.service.description}
                            </span>
                        )}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Статус',
            sortable: true,
            accessor: (row) => row.status,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => (
                <Button href={routes.masterArea.appointments(row.status)} variant="ghost" size="sm">
                    Открыть
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout
            title={`Здравствуйте, ${greetingName}`}
            subtitle={MASTER_COPY.dashboardSubtitle}
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'Обзор' }]}
            notificationCount={pending > 0 ? pending : undefined}
            actions={
                <>
                    {/* Compact: at 1024 the full-size pair wrapped onto a second
                        line and doubled the greeting block's height. */}
                    <Button href={routes.masterArea.schedule} variant="ghost" size="sm">
                        График работы
                    </Button>
                    <Button href={routes.masterArea.appointments()} variant="ghost" size="sm">
                        Все записи
                    </Button>
                </>
            }
        >
            <Head title="Кабинет мастера" />

            {/*
             * Profile nudge: only while the public card would show a
             * placeholder. A master with a photo sees nothing here.
             */}
            {(photo === null || photo === '') && (
                <Link
                    href={routes.masterArea.profile}
                    className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-5 py-4 text-sm transition-all duration-300 hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                    <span className="text-text-secondary">
                        На публичной странице ваша карточка пока без фотографии.
                    </span>
                    <span className="font-medium text-accent">Установите фото профиля →</span>
                </Link>
            )}

            {pending > 0 && (
                <div
                    role="alert"
                    className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs text-text-secondary"
                >
                    <AlertIcon className="h-3.5 w-3.5 shrink-0 text-accent" />

                    <p className="min-w-0 flex-1">
                        <span className="font-medium text-text-primary">
                            {pending} {plural(pending, 'заявка ждёт', 'заявки ждут', 'заявок ждут')}
                        </span>{' '}
                        подтверждения. Клиенты не увидят стоимость, пока вы не подтвердите запись.
                    </p>

                    {/* A text link, not a button: the strip must stay a strip. */}
                    <Link
                        href={routes.masterArea.appointments('pending')}
                        className="shrink-0 font-medium text-accent underline underline-offset-2 transition-all duration-300 hover:text-accent-hover"
                    >
                        Перейти к новым
                    </Link>
                </div>
            )}

            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <li>
                    <StatCard
                        label="Записей сегодня"
                        value={todayTotal}
                        tone="accent"
                        icon={<CalendarIcon />}
                        hint={todayTotal === 0 ? 'Свободный день' : undefined}
                    />
                </li>

                <li>
                    <StatCard label="Записей за неделю" value={weekTotal} icon={<ClockIcon />} />
                </li>

                <li>
                    <StatCard
                        label="Ждут подтверждения"
                        value={pending}
                        tone={pending > 0 ? 'warning' : 'success'}
                        icon={<AlertIcon />}
                    />
                </li>

                <li>
                    <StatCard
                        label="Выручка за месяц"
                        value={revenue === null ? '—' : formatPrice(revenue)}
                        tone="accent"
                        icon={<ScissorsIcon />}
                        hint="По завершённым визитам"
                    />
                </li>
            </ul>

            {(stats.rating !== undefined || stats.reviews !== undefined) && (
                /*
                 * The whole card links to this master's public review wall.
                 * The CTA inside is a styled span rather than a nested button —
                 * a button inside an anchor is invalid HTML and would swallow
                 * the link.
                 */
                <Link
                    href={stats.reviews_url ?? routes.reviews()}
                    className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-bg-elevated px-6 py-5 transition-all duration-300 hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                    <span className="flex items-center gap-2 text-sm text-text-secondary">
                        <StarIcon className="h-4 w-4 text-accent" />
                        Мой рейтинг
                    </span>

                    <RatingStars
                        value={stats.rating ?? 0}
                        count={stats.reviews_count ?? stats.reviews}
                        size="md"
                    />

                    <span className="ml-auto flex flex-wrap items-center gap-4">
                        {siteSettings.site_name !== null && siteSettings.site_name !== undefined && (
                            <span className="text-xs text-text-secondary">
                                {siteSettings.site_name}
                            </span>
                        )}

                        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-primary">
                            Смотреть все отзывы
                        </span>
                    </span>
                </Link>
            )}

            <section className="mt-12" aria-labelledby="today-heading">
                <h2
                    id="today-heading"
                    className="mb-4 font-display text-xl font-semibold text-text-primary"
                >
                    Ближайшие записи
                </h2>

                {todayAppointments.length === 0 ? (
                    <EmptyState
                        icon={<CalendarIcon />}
                        title="На сегодня записей нет"
                        description="Проверьте график работы — возможно, выходной или ещё нет заявок."
                        action={
                            <Button href={routes.masterArea.schedule} variant="ghost">
                                Настроить график
                            </Button>
                        }
                    />
                ) : (
                    <DataTable
                        caption="Записи на сегодня"
                        columns={columns}
                        rows={rows}
                        rowKey={(row) => row.id}
                        sort={sort}
                        direction={direction}
                        onSort={(column, dir) => {
                            setSort(column);
                            setDirection(dir);
                        }}
                    />
                )}
            </section>

            {schedules.length > 0 && (
                <section className="mt-12" aria-labelledby="week-heading">
                    <h2
                        id="week-heading"
                        className="mb-4 font-display text-xl font-semibold text-text-primary"
                    >
                        Рабочая неделя
                    </h2>

                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {schedules.map((day) => (
                            <li
                                key={day.weekday}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm"
                            >
                                <span className="text-text-primary">
                                    {WEEKDAYS[day.weekday] ?? day.label ?? '—'}
                                </span>

                                <span className="tabular-nums text-text-secondary">
                                    {trimTime(day.start_time)}–{trimTime(day.end_time)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </AdminLayout>
    );
}

/** `"2025-03-12T14:30:00+03:00"` → `"14:30"`. */
function formatTime(value: string | null): string {
    if (value === null) {
        return '—';
    }

    const match = /T(\d{2}:\d{2})/.exec(value);

    return match?.[1] ?? '—';
}

/** `"14:30:00"` → `"14:30"`. */
function trimTime(value: string | null | undefined): string {
    if (value === null || value === undefined) {
        return '—';
    }

    return value.slice(0, 5);
}

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
