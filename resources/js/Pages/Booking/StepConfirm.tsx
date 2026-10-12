import { useState, type FormEvent, type ReactNode } from 'react';
import { SummaryCard } from '@/Components/Booking/SummaryCard';
import { PhotoDropzone } from '@/Components/Booking/PhotoDropzone';
import { Textarea } from '@/Components/UI/Textarea';
import { Button } from '@/Components/UI/Button';
import { Modal } from '@/Components/UI/Modal';
import { AlertIcon } from '@/lib/icons';
import { BOOKING_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';
import { formatIsoDateLabel } from '@/lib/date';
import { sanitizeHtml } from '@/lib/sanitize';
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

    /** Published /privacy page, shown in the consent modal. */
    privacyContent?: { title?: string | null; content?: string | null } | null;

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
    privacyContent = null,
    processing,
    onSubmit,
    onBack,
}: StepConfirmProps) {
    const [privacyOpen, setPrivacyOpen] = useState(false);

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
                                 * Opens the policy in a modal instead of a new
                                 * tab. A <button>, not an <a>: the click is
                                 * stopped from bubbling because the trigger sits
                                 * inside the <label> and would otherwise flip
                                 * the checkbox as well.
                                 */}
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setPrivacyOpen(true);
                                    }}
                                    className="text-accent underline underline-offset-2 transition-all duration-300 hover:text-accent-hover"
                                >
                                    {BOOKING_COPY.agreeLink}
                                </button>
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
                        submits on Enter as well as on the button, and sticky to
                        the bottom of the viewport like the wizard's own bar. */}
                    <div
                        className={cn(
                            'sticky bottom-0 z-20 flex flex-col gap-3 border-t border-border bg-bg-primary/95 pb-4 pt-4 backdrop-blur sm:flex-row-reverse',
                        )}
                    >
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

            {/* Personal-data policy. Escape, the backdrop and the close button
                all come from <Modal>; the body scrolls when the text is long. */}
            <Modal
                open={privacyOpen}
                onClose={() => setPrivacyOpen(false)}
                size="lg"
                title={privacyContent?.title ?? 'Политика обработки персональных данных'}
            >
                {privacyContent?.content !== undefined &&
                privacyContent?.content !== null &&
                privacyContent.content !== '' ? (
                    <div
                        className="prose-barber text-sm leading-relaxed text-text-secondary"
                        // Sanitised exactly like the public page render.
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(privacyContent.content),
                        }}
                    />
                ) : (
                    <p className="text-sm text-text-secondary">
                        Текст политики пока не опубликован. Полную версию можно открыть на
                        странице{' '}
                        <a
                            href={routes.pages.privacy}
                            className="text-accent underline underline-offset-2"
                        >
                            /privacy
                        </a>
                        .
                    </p>
                )}

                <div className="mt-6 flex justify-end">
                    <Button type="button" onClick={() => setPrivacyOpen(false)}>
                        Закрыть
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default StepConfirm;
