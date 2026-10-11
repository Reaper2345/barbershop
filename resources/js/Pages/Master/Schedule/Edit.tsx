import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { ConfirmDialog } from '@/Components/Admin/ConfirmDialog';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { EmptyState } from '@/Components/UI/EmptyState';
import { CalendarIcon } from '@/lib/icons';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { formatIsoDateLabel, todayIso } from '@/lib/date';
import { MASTER_COPY } from '@/lib/content';
import { cn } from '@/lib/format';
import type { MasterScheduleDay, TimeOffRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Schedule/Edit — GET/PUT /master/schedule
|--------------------------------------------------------------------------
| Weekly grid: one row per weekday (Пн–Вс display order), each with an
| is_active toggle and four time inputs, plus the "Выходные и исключения"
| section with the time-off list and an add form.
|
| The payload shape is fixed by UpdateScheduleRequest: `days` is validated as an
| array of exactly 7 entries and the controller's foreach uses the KEY as the
| weekday (`Schedule::updateOrCreate(['weekday' => (int) $weekday])`). So days
| is posted as an object keyed by the Carbon weekday (0 = Sunday). A positional
| list would map Monday's hours onto Sunday.
|
| Times are sent as "HH:MM" (the controller appends ":00"); an empty break
| string becomes null.
*/

export interface MasterScheduleProps {
    days?: MasterScheduleDay[];
    timeOff?: TimeOffRow[];
}

/** Monday-first display order → Carbon weekday (0 = Sunday). */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const WEEKDAY_LABELS: Record<number, string> = {
    0: 'Воскресенье',
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
};

const TIME_FIELDS = [
    ['start_time', 'Начало рабочего дня'],
    ['end_time', 'Окончание рабочего дня'],
    ['break_start', 'Начало перерыва'],
    ['break_end', 'Окончание перерыва'],
] as const;

interface DayForm {
    weekday: number;
    label: string;
    is_active: boolean;
    start_time: string;
    end_time: string;
    break_start: string;
    break_end: string;
}

interface ScheduleForm {
    /** Keyed by Carbon weekday so the key survives the round trip. */
    days: Record<number, DayForm>;
}

export default function MasterSchedule({ days = [], timeOff = [] }: MasterScheduleProps) {
    const initialDays = useMemo<Record<number, DayForm>>(() => {
        const byWeekday = new Map(days.map((day) => [day.weekday, day]));
        const record: Record<number, DayForm> = {};

        for (const weekday of DISPLAY_ORDER) {
            const source = byWeekday.get(weekday);

            record[weekday] = {
                weekday,
                label: source?.label ?? WEEKDAY_LABELS[weekday] ?? String(weekday),
                is_active: source?.is_active ?? false,
                start_time: source?.start_time ?? '10:00',
                end_time: source?.end_time ?? '20:00',
                break_start: source?.break_start ?? '',
                break_end: source?.break_end ?? '',
            };
        }

        return record;
    }, [days]);

    const form = useForm<ScheduleForm>({ days: initialDays });

    // Local mirror for immediate UI updates; pushed into form data on change.
    const [rows, setRows] = useState<Record<number, DayForm>>(initialDays);

    const updateDay = (weekday: number, patch: Partial<DayForm>): void => {
        const current = rows[weekday];

        if (current === undefined) {
            return;
        }

        const next = { ...rows, [weekday]: { ...current, ...patch } };

        setRows(next);
        form.setData('days', next);
    };

    /** Keys are `days.<weekday>.<field>`, matching the posted object keys. */
    const dayError = (weekday: number, field: keyof DayForm): string | undefined =>
        form.errors[`days.${weekday}.${field}` as keyof typeof form.errors];

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.transform((data) => {
            const payload: Record<string, unknown> = {};

            for (const weekday of DISPLAY_ORDER) {
                const day = data.days[weekday];

                if (day === undefined) {
                    continue;
                }

                payload[String(weekday)] = {
                    is_active: day.is_active,
                    // Inactive days fall back to the controller's defaults.
                    start_time: day.is_active ? day.start_time : null,
                    end_time: day.is_active ? day.end_time : null,
                    break_start: day.break_start === '' ? null : day.break_start,
                    break_end: day.break_end === '' ? null : day.break_end,
                };
            }

            return { days: payload };
        });

        form.put(routes.masterArea.schedule, { preserveScroll: true });
    };

    return (
        <AdminLayout
            title={MASTER_COPY.scheduleTitle}
            subtitle={MASTER_COPY.scheduleSubtitle}
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'График работы' }]}
        >
            <Head title={MASTER_COPY.scheduleTitle} />

            <form onSubmit={submit}>
                <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[52rem] border-collapse text-sm">
                            <caption className="sr-only">График работы по дням недели</caption>

                            <thead>
                                <tr className="border-b border-border bg-bg-secondary text-xs uppercase tracking-wider text-text-secondary">
                                    <th scope="col" className="px-4 py-3 text-left">
                                        День
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Рабочий
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Начало
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Окончание
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Перерыв с
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left">
                                        Перерыв до
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {DISPLAY_ORDER.map((weekday) => {
                                    const day = rows[weekday];

                                    if (day === undefined) {
                                        return null;
                                    }

                                    return (
                                        <tr
                                            key={weekday}
                                            className={cn(
                                                'border-b border-border/60 transition-colors duration-200 last:border-b-0',
                                                !day.is_active && 'bg-bg-secondary/40',
                                            )}
                                        >
                                            <th
                                                scope="row"
                                                className="px-4 py-3 text-left font-medium text-text-primary"
                                            >
                                                {day.label}
                                            </th>

                                            <td className="px-4 py-3">
                                                <label className="inline-flex cursor-pointer items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={day.is_active}
                                                        onChange={(event) =>
                                                            updateDay(weekday, {
                                                                is_active: event.target.checked,
                                                            })
                                                        }
                                                        className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus-visible:ring-2 focus-visible:ring-accent"
                                                    />
                                                    <span className="sr-only">
                                                        {day.label} — рабочий день
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'text-xs',
                                                            day.is_active
                                                                ? 'text-success'
                                                                : 'text-text-secondary',
                                                        )}
                                                        aria-hidden="true"
                                                    >
                                                        {day.is_active ? 'Да' : 'Нет'}
                                                    </span>
                                                </label>
                                            </td>

                                            {TIME_FIELDS.map(([field, label]) => {
                                                const error = dayError(weekday, field);

                                                return (
                                                    <td key={field} className="px-4 py-3">
                                                        <input
                                                            type="time"
                                                            value={day[field]}
                                                            disabled={!day.is_active}
                                                            aria-label={`${day.label}: ${label}`}
                                                            aria-invalid={error !== undefined || undefined}
                                                            onChange={(event) =>
                                                                updateDay(weekday, {
                                                                    [field]: event.target.value,
                                                                })
                                                            }
                                                            className={cn(
                                                                'w-32 rounded-xl border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
                                                                'transition-all duration-300 focus:outline-none focus-visible:ring-2',
                                                                'disabled:cursor-not-allowed disabled:opacity-40',
                                                                error !== undefined
                                                                    ? 'border-danger focus-visible:ring-danger'
                                                                    : 'border-border focus-visible:border-accent focus-visible:ring-accent/60',
                                                            )}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ValidationSummary errors={form.errors} rows={rows} />

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button type="submit" loading={form.processing} size="lg">
                        Сохранить график
                    </Button>

                    <p className="text-xs text-text-secondary">
                        Изменения вступят в силу сразу: клиенты увидят новые свободные слоты.
                    </p>
                </div>
            </form>

            <TimeOffSection timeOff={timeOff} />
        </AdminLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Validation summary
|--------------------------------------------------------------------------
| The grid is wide, so a single bad cell is easy to miss. This lists every
| message with the weekday it belongs to.
*/

function ValidationSummary({
    errors,
    rows,
}: {
    errors: Record<string, string>;
    rows: Record<number, DayForm>;
}) {
    const messages = DISPLAY_ORDER.flatMap((weekday) => {
        const day = rows[weekday];

        if (day === undefined) {
            return [];
        }

        return TIME_FIELDS.map(([field, label]) => {
            const message = errors[`days.${weekday}.${field}`];

            return message === undefined ? null : `${day.label}: ${label} — ${message}`;
        }).filter((value): value is string => value !== null);
    });

    const listError = errors['days'];

    if (messages.length === 0 && listError === undefined) {
        return null;
    }

    return (
        <ul
            role="alert"
            className="mt-4 space-y-1 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger"
        >
            {listError !== undefined && <li>{listError}</li>}
            {messages.map((message) => (
                <li key={message}>{message}</li>
            ))}
        </ul>
    );
}

/*
|--------------------------------------------------------------------------
| Time off
|--------------------------------------------------------------------------
| StoreTimeOffRequest requires a date on/after today and a unique
| (master_id, date) pair; the controller reports a duplicate as a `date` error.
*/

interface TimeOffForm {
    date: string;
    reason: string;
}

function TimeOffSection({ timeOff }: { timeOff: TimeOffRow[] }) {
    const form = useForm<TimeOffForm>({ date: '', reason: '' });
    const [deleting, setDeleting] = useState<TimeOffRow | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const remove = (): void => {
        if (deleting === null) {
            return;
        }

        form.delete(routes.masterArea.timeOffDelete(deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (form.data.date === '') {
            setLocalError('Выберите дату выходного.');

            return;
        }

        if (form.data.date < todayIso()) {
            setLocalError('Нельзя добавить выходной на прошедшую дату.');

            return;
        }

        setLocalError(null);

        form.post(routes.masterArea.timeOff, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <section className="mt-14" aria-labelledby="timeoff-heading">
            <h2 id="timeoff-heading" className="font-display text-xl font-semibold text-text-primary">
                Выходные и исключения
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Дни, вычёркиваемые из недельного графика: отпуск, обучение, личные дела. В эти даты
                запись недоступна.
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div>
                    {timeOff.length === 0 ? (
                        <EmptyState
                            size="sm"
                            icon={<CalendarIcon />}
                            title="Исключений нет"
                            description="Вы работаете по обычному недельному графику."
                        />
                    ) : (
                        <ul className="space-y-3">
                            {timeOff.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-bg-elevated px-5 py-4"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">
                                            {formatIsoDateLabel(entry.date.slice(0, 10), true)}
                                        </p>

                                        {entry.reason !== null && entry.reason !== '' && (
                                            <p className="mt-1 text-xs text-text-secondary">
                                                {entry.reason}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleting(entry)}
                                        className="border-danger/50 text-danger hover:border-danger hover:text-danger"
                                    >
                                        Удалить
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-5 rounded-2xl border border-border bg-bg-elevated p-6"
                    noValidate
                >
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                        Добавить выходной
                    </h3>

                    <Input
                        label="Дата"
                        name="date"
                        type="date"
                        required
                        min={todayIso()}
                        value={form.data.date}
                        error={localError ?? form.errors.date}
                        onChange={(event) => {
                            setLocalError(null);
                            form.setData('date', event.target.value);
                        }}
                    />

                    <Input
                        label="Причина"
                        name="reason"
                        maxLength={255}
                        placeholder="Например: отпуск"
                        value={form.data.reason}
                        error={form.errors.reason}
                        onChange={(event) => form.setData('reason', event.target.value)}
                    />

                    <Button type="submit" loading={form.processing} fullWidth>
                        Добавить
                    </Button>
                </form>
            </div>

            <ConfirmDialog
                open={deleting !== null}
                title="Удалить выходной?"
                message={renderDeleteMessage(deleting)}
                confirmLabel="Удалить"
                processing={form.processing}
                onConfirm={remove}
                onClose={() => setDeleting(null)}
            />
        </section>
    );
}

function renderDeleteMessage(deleting: TimeOffRow | null): ReactNode {
    if (deleting === null) {
        return null;
    }

    return (
        <>
            День{' '}
            <span className="text-text-primary">
                {formatIsoDateLabel(deleting.date.slice(0, 10), true)}
            </span>{' '}
            снова станет рабочим, если он попадает в недельный график.
        </>
    );
}
