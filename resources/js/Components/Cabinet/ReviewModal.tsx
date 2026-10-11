import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/Components/UI/Modal';
import { Textarea } from '@/Components/UI/Textarea';
import { Button } from '@/Components/UI/Button';
import { RatingStars } from '@/Components/UI/RatingStars';
import { PhotoDropzone } from '@/Components/Booking/PhotoDropzone';
import { CABINET_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import type { CabinetAppointment } from '@/types';

/*
|--------------------------------------------------------------------------
| Reviews/Create
|--------------------------------------------------------------------------
| The review form, presented as a modal (the brief allows a modal or a page)
| and triggered from any `done` appointment that has no review yet.
|
| POST /cabinet/reviews with { appointment_id, rating, text }, validated by
| StoreReviewRequest:
|   - appointment_id must be one of *this client's* completed visits,
|   - a visit can only be reviewed once (reviews.appointment_id is unique),
|   - rating is required, 1–5.
|
| Reviews are created unapproved and appear publicly after moderation, which
| the copy states explicitly so the client is not surprised.
*/

export interface ReviewModalProps {
    appointment: CabinetAppointment | null;
    open: boolean;
    onClose: () => void;
}

interface ReviewForm {
    appointment_id: number | null;
    rating: number;
    text: string;
    photo: File | null;
}

export function ReviewModal({ appointment, open, onClose }: ReviewModalProps) {
    const form = useForm<ReviewForm>({
        appointment_id: appointment?.id ?? null,
        rating: 0,
        text: '',
        photo: null,
    });
    const [localRatingError, setLocalRatingError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setData({
            appointment_id: appointment?.id ?? null,
            rating: 0,
            text: '',
            photo: null,
        });
        form.clearErrors();
        setLocalRatingError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, appointment?.id]);

    // Success closes the dialog a beat after the flash appears.
    useEffect(() => {
        if (form.recentlySuccessful) {
            const timeout = window.setTimeout(onClose, 900);

            return () => window.clearTimeout(timeout);
        }

        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.recentlySuccessful]);

    if (appointment === null) {
        return null;
    }

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // Client-side mirror of the `rating` required rule.
        if (form.data.rating < 1) {
            setLocalRatingError(CABINET_COPY.reviewRatingError);

            return;
        }

        setLocalRatingError(null);

        /*
         * The photo is only added to the payload when one was picked, so an
         * empty submission never carries a stray `photo` key. forceFormData
         * makes the request multipart unconditionally; the route is POST, which
         * PHP parses normally (no _method spoofing needed).
         */
        form.transform((data) => ({
            appointment_id: data.appointment_id,
            rating: data.rating,
            text: data.text,
            ...(data.photo !== null ? { photo: data.photo } : {}),
        }));

        form.post(routes.cabinetReviews, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const serviceName = appointment.service?.name ?? 'визит';
    const masterName = appointment.master?.name ?? 'мастер';

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="md"
            title={CABINET_COPY.reviewTitle}
            description={CABINET_COPY.reviewText}
        >
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm">
                <p className="font-medium text-text-primary">{serviceName}</p>
                <p className="mt-1 text-text-secondary">
                    {masterName}
                    {appointment.date_label !== null && appointment.date_label !== undefined
                        ? ` · ${appointment.date_label}`
                        : ''}
                </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
                <fieldset>
                    <legend className="mb-2 block text-sm font-medium text-text-primary">
                        {CABINET_COPY.reviewRating}
                    </legend>

                    <RatingStars
                        interactive
                        value={form.data.rating}
                        onChange={(rating) => {
                            form.setData('rating', rating);
                            setLocalRatingError(null);
                        }}
                    />

                    {(localRatingError ?? form.errors.rating) !== undefined && (
                        <p role="alert" className="mt-2 text-xs text-danger">
                            {localRatingError ?? form.errors.rating}
                        </p>
                    )}
                </fieldset>

                <Textarea
                    label={CABINET_COPY.reviewComment}
                    name="text"
                    rows={4}
                    maxLength={2000}
                    placeholder={CABINET_COPY.reviewCommentPlaceholder}
                    value={form.data.text}
                    error={form.errors.text}
                    disabled={form.processing}
                    onChange={(event) => form.setData('text', event.target.value)}
                />

                <PhotoDropzone
                    value={form.data.photo}
                    onChange={(file) => form.setData('photo', file)}
                    error={form.errors.photo}
                    disabled={form.processing}
                    label="Фото (необязательно)"
                    hint="JPG, PNG или WEBP, до 5 МБ. Покажет результат вашего визита."
                />

                {/* The backend needs the id; it is fixed by the row clicked. */}
                <input type="hidden" name="appointment_id" value={appointment.id} />

                {form.errors.appointment_id !== undefined && (
                    <p role="alert" className="text-xs text-danger">
                        {form.errors.appointment_id}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row-reverse">
                    <Button
                        type="submit"
                        loading={form.processing}
                        disabled={form.recentlySuccessful}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {CABINET_COPY.reviewSubmit}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={form.processing}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {CABINET_COPY.cancelKeep}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default ReviewModal;
