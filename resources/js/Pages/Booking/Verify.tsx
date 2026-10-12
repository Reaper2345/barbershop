import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Components/Layout/AppLayout';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { AlertIcon, MailIcon } from '@/lib/icons';
import { routes } from '@/lib/routes';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Booking/Verify — GET /booking/verify/{appointment}
|--------------------------------------------------------------------------
| The client just booked; a 6-digit code is in their inbox and this page is
| where they type it. Confirmation is CLIENT-side on purpose: the master never
| enters the code, they only confirm the visit (price + status) afterwards.
|
| Only the owning client and only while the booking is still pending can see
| this page (AppointmentPolicy@verify).
|
| Abandoning is EXPLICIT: only the «Отменить запись» button cancels the booking.
| Escape, a refresh or navigating away does NOT — a client who closed the tab
| should still find their booking waiting when they come back. The server also
| expires the code after 15 minutes and kills it after 5 wrong guesses.
*/

export interface BookingVerifyProps {
    appointment: {
        id: number;
        client_email: string | null;
        starts_at_label: string | null;
        service_name: string | null;
        master_name: string | null;
        resend_available_in: number;
    };
}

export default function BookingVerify({ appointment }: BookingVerifyProps) {
    const { auth } = usePage<SharedProps>().props;

    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(appointment.resend_available_in);
    const [resending, setResending] = useState(false);
    const [resendNotice, setResendNotice] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the field on arrival: the visitor is here to type six digits.
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // 60-second resend cooldown, ticking down once per second.
    useEffect(() => {
        if (cooldown <= 0) {
            return;
        }

        const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);

        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (!/^\d{6}$/.test(code)) {
            setError('Введите 6 цифр из письма.');

            return;
        }

        setError(null);
        setProcessing(true);

        router.post(
            routes.bookingVerify(appointment.id),
            { code },
            {
                preserveScroll: true,
                onError: (errors) => setError(errors.code ?? 'Не удалось проверить код.'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const resend = (): void => {
        if (cooldown > 0 || resending) {
            return;
        }

        setResending(true);
        setError(null);

        router.post(
            routes.bookingResend(appointment.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResendNotice('Новый код отправлен.');
                    setCooldown(60);
                },
                onError: (errors) => setError(errors.code ?? 'Не удалось отправить код.'),
                onFinish: () => setResending(false),
            },
        );
    };

    const cancelBooking = (): void => {
        setCancelling(true);

        router.post(routes.bookingCancelVerify(appointment.id));
    };

    return (
        <AppLayout title="Подтверждение записи">
            <Head title="Подтверждение записи" />

            <section className="section">
                <div className="container-page">
                    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 sm:p-8">
                        <span
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent"
                            aria-hidden="true"
                        >
                            <MailIcon className="h-5 w-5" />
                        </span>

                        <h1 className="mt-5 font-display text-2xl font-semibold text-text-primary">
                            Подтвердите запись
                        </h1>

                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                            Мы отправили 6-значный код на{' '}
                            <span className="text-text-primary">
                                {appointment.client_email ?? auth.user?.email ?? 'вашу почту'}
                            </span>
                            . Введите его, чтобы подтвердить запись.
                        </p>

                        {(appointment.service_name !== null ||
                            appointment.starts_at_label !== null) && (
                            <p className="mt-3 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
                                {appointment.service_name}
                                {appointment.starts_at_label !== null && (
                                    <>
                                        {' · '}
                                        <span className="text-text-primary">
                                            {appointment.starts_at_label}
                                        </span>
                                    </>
                                )}
                                {appointment.master_name !== null && ` · ${appointment.master_name}`}
                            </p>
                        )}

                        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
                            <Input
                                ref={inputRef}
                                label="Код из письма"
                                name="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                                placeholder="000000"
                                value={code}
                                error={error ?? undefined}
                                className="text-center text-lg tracking-[0.5em]"
                                onChange={(event) => {
                                    setError(null);
                                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                                }}
                            />

                            <Button type="submit" size="lg" fullWidth loading={processing}>
                                Подтвердить
                            </Button>
                        </form>

                        {resendNotice !== null && (
                            <p role="status" className="mt-4 text-center text-sm text-success">
                                {resendNotice}
                            </p>
                        )}

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                            {cooldown > 0 ? (
                                <span className="text-text-secondary">
                                    Отправить код заново через {cooldown} с
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resend}
                                    disabled={resending}
                                    className="text-accent underline underline-offset-2 transition-all duration-300 hover:text-accent-hover disabled:opacity-60"
                                >
                                    Отправить код заново
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={cancelBooking}
                                disabled={cancelling}
                                className="text-text-secondary underline underline-offset-2 transition-all duration-300 hover:text-danger disabled:opacity-60"
                            >
                                Отменить запись
                            </button>
                        </div>

                        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
                            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                            Если закрыть страницу, запись не отменится: вернуться к подтверждению можно
                            по ссылке из письма. Отмена — только кнопкой «Отменить запись».
                        </p>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
