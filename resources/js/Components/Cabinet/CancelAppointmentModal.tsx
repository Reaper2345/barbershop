import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/Components/UI/Modal';
import { Textarea } from '@/Components/UI/Textarea';
import { Button } from '@/Components/UI/Button';
import { CABINET_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { formatIsoDateLabel } from '@/lib/date';
import type { CabinetAppointment } from '@/types';

/*
|--------------------------------------------------------------------------
| CancelAppointmentModal
|--------------------------------------------------------------------------
| Confirmation dialog for PATCH /cabinet/appointments/{id}/cancel.
|
| The reason is optional. The PROMPT 1 schema has no cancellation-reason
| column, so the backend appends it to `client_comment`, where the master can
| read it in the appointment card.
|
| The dialog is intentionally hard to fat-finger: the destructive action is the
| secondary button, and "Оставить запись" is the primary one.
*/

export interface CancelAppointmentModalProps {
    appointment: CabinetAppointment | null;
    open: boolean;
    onClose: () => void;
    onCancelled?: () => void;
}

interface CancelForm {
    reason: string;
}

export function CancelAppointmentModal({
    appointment,
    open,
    onClose,
    onCancelled,
}: CancelAppointmentModalProps) {
    const form = useForm<CancelForm>({ reason: '' });
    const [serverError, setServerError] = useState<string | null>(null);

    // Reset the form whenever a new appointment is targeted.
    useEffect(() => {
        if (open) {
            form.reset();
            form.clearErrors();
            setServerError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, appointment?.id]);

    if (appointment === null) {
        return null;
    }

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (appointment.id === undefined) {
            return;
        }

        form.patch(routes.cabinetCancel(appointment.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                onCancelled?.();
            },
            onError: (errors) => {
                setServerError(
                    errors.reason ??
                        errors.appointment ??
                        'Не удалось отменить запись. Попробуйте ещё раз или позвоните нам.',
                );
            },
        });
    };

    const serviceName = appointment.service?.name ?? 'запись';
    const when =
        appointment.starts_at_label ??
        (appointment.starts_at !== null
            ? formatIsoDateLabel(appointment.starts_at.slice(0, 10), true)
            : '');

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="md"
            title={CABINET_COPY.cancelTitle}
            description={CABINET_COPY.cancelText}
        >
            {/* What exactly is being cancelled — never make the user guess. */}
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm">
                <p className="font-medium text-text-primary">{serviceName}</p>
                <p className="mt-1 text-text-secondary">{when}</p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
                <Textarea
                    label={CABINET_COPY.cancelReason}
                    name="reason"
                    rows={3}
                    maxLength={500}
                    placeholder={CABINET_COPY.cancelReasonPlaceholder}
                    value={form.data.reason}
                    error={form.errors.reason}
                    disabled={form.processing}
                    onChange={(event) => form.setData('reason', event.target.value)}
                />

                {serverError !== null && (
                    <p role="alert" className="text-xs text-danger">
                        {serverError}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row-reverse">
                    {/* Safe action first in DOM order for keyboard users. */}
                    <Button
                        type="button"
                        variant="primary"
                        onClick={onClose}
                        disabled={form.processing}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {CABINET_COPY.cancelKeep}
                    </Button>

                    <Button
                        type="submit"
                        variant="ghost"
                        loading={form.processing}
                        fullWidth
                        className="border-danger/50 text-danger hover:border-danger hover:text-danger sm:w-auto"
                    >
                        {CABINET_COPY.cancelConfirm}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default CancelAppointmentModal;
