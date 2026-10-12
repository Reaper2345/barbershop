import type { FormEvent, ReactNode } from 'react';
import { SummaryCard } from '@/Components/Booking/SummaryCard';
import { PhotoDropzone } from '@/Components/Booking/PhotoDropzone';
import { Textarea } from '@/Components/UI/Textarea';
import { Button } from '@/Components/UI/Button';
import { AlertIcon } from '@/lib/icons';
import { BOOKING_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { formatIsoDateLabel } from '@/lib/date';
import { cn } from '@/lib/format';
import type { BookingSlot } from '@/types';

/*
|--------------------------------------------------------------------------
| Step 4 — confirm
|--------------------------------------------------------------------------
| Final summary plus the three optional/required inputs:
|   - client_comment (optional, max 2000 — mirrors the FormRequest rule),
|   - photo (optional, image ≤ 5 MB, drag & drop),
|   - the terms checkbox (required; the backend has no rule for it, so this is
|     a pure client-side gate enforced in the wizard).
|
| Validation errors that the server returns for `starts_at` (slot taken while
| the wizard was open) are surfaced as a banner with a jump back to step 3.
*/

export interface StepConfirmProps {
    serviceName: string;
    masterName: string;
    masterPhotoSlot?: ReactNode;
    date: string | null;
    slot: BookingSlot | null;
    durationMinutes: number | null;
    priceMin: number | string | null;
    priceMax: number | string | null;

    comment: string;
    onCommentChange: (value: string) => void;
    commentError?: string;

    photo: File | null;
    onPhotoChange: (file: File | null) => void;
    photoError?: string;

    agreed: boolean;
    onAgreedChange: (agreed: boolean) => void;
    agreedError?: string;

    /** Non-field errors, e.g. a rejected slot or a server failure. */
    formError?: string | null;
    onBackToDateTime?: () => void;

    processing: boolean;
    onSubmit: () => void;
    onBack: () => void;
}

export function StepConfirm({
    serviceName,
    masterName,
    masterPhotoSlot,
    date,
    slot,
    durationMinutes,
    priceMin,
    priceMax,
    comment,
    onCommentChange,
    commentError,
    photo,
    onPhotoChange,
    photoError,
    agreed,
    onAgreedChange,
    agreedError,
    formError,
    onBackToDateTime,
    processing,
    onSubmit,
    onBack,
}: StepConfirmProps) {
    // The wizard owns submission state, so the form element only forwards to it.
    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <div>
            <header>
                <h2 className="font-display text-2xl font-semibold text-text-primary">
                    {BOOKING_COPY.confirmTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {BOOKING_COPY.confirmSubtitle}
                </p>
            </header>

            {formError !== null && formError !== undefined && (
                <div
                    role="alert"
                    className="mt-6 flex flex-wrap items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text-primary"
                >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <span className="min-w-0 flex-1">{formError}</span>

                    {onBackToDateTime !== undefined && (
                        <button
                            type="button"
                            onClick={onBackToDateTime}
                            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-text-primary transition-all duration-300 hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            Выбрать другое время
                        </button>
                    )}
                </div>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                {/* Summary */}
                <div>
                    <p className="mb-3 text-xs uppercase tracking-wider text-text-secondary">
                        {BOOKING_COPY.summary}
                    </p>

                    <SummaryCard
                        image={masterPhotoSlot}
                        rows={[
                            { label: BOOKING_COPY.service, value: serviceName, emphasis: true },
                            { label: BOOKING_COPY.master, value: masterName },
                            {
                                label: BOOKING_COPY.date,
                                value: date !== null ? formatIsoDateLabel(date, true) : '—',
                            },
                            { label: BOOKING_COPY.time, value: slot?.time ?? '—' },
                        ]}
                        durationMinutes={durationMinutes}
                        priceMin={priceMin}
                        priceMax={priceMax}
                        priceNote={BOOKING_COPY.priceNote}
                    />
                </div>

                {/* Inputs */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <Textarea
                        label={BOOKING_COPY.commentLabel}
                        name="client_comment"
                        rows={5}
                        maxLength={2000}
                        placeholder={BOOKING_COPY.commentPlaceholder}
                        hint={BOOKING_COPY.commentHint}
                        value={comment}
                        error={commentError}
                        disabled={processing}
                        onChange={(event) => onCommentChange(event.target.value)}
                    />

                    <PhotoDropzone
                        value={photo}
                        onChange={onPhotoChange}
                        error={photoError}
                        disabled={processing}
                    />

                    {/* Terms */}
                    <div>
                        <label className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
                            <input
                                type="checkbox"
                                name="agreement"
                                checked={agreed}
                                disabled={processing}
                                aria-invalid={agreedError !== undefined || undefined}
                                onChange={(event) => onAgreedChange(event.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-bg-secondary text-accent focus-visible:ring-2 focus-visible:ring-accent"
                            />
                            <span>
                                {BOOKING_COPY.agreePrefix}
                                {/*
                                 * Opens the policy in a new tab. The click is
                                 * stopped from bubbling: the link sits inside
                                 * the <label>, and without this a click on it
                                 * would also flip the checkbox.
                                 */}
                                <a
                                    href={routes.pages.privacy}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="text-accent underline underline-offset-2 transition-all duration-300 hover:text-accent-hover"
                                >
                                    {BOOKING_COPY.agreeLink}
                                </a>
                            </span>
                        </label>

                        {agreedError !== undefined && (
                            <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                                <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                                {agreedError}
                            </p>
                        )}
                    </div>

                    {/* Actions — duplicated from the wizard footer so the form
                        submits on Enter as well as on the button. */}
                    <div className={cn('flex flex-col gap-3 pt-2 sm:flex-row-reverse')}>
                        <Button
                            type="submit"
                            size="lg"
                            loading={processing}
                            fullWidth
                            className="sm:w-auto"
                        >
                            {processing ? BOOKING_COPY.submitting : BOOKING_COPY.submit}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            disabled={processing}
                            onClick={onBack}
                            fullWidth
                            className="sm:w-auto"
                        >
                            {BOOKING_COPY.back}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StepConfirm;
