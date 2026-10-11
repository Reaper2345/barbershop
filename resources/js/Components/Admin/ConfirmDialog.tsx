import type { ReactNode } from 'react';
import { Modal } from '@/Components/UI/Modal';
import { Button } from '@/Components/UI/Button';
import { AlertIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| ConfirmDialog
|--------------------------------------------------------------------------
| Destructive-action confirmation (delete a review, delete a user, remove a
| day off…). Content is passed in so the dialog can name the exact record.
|
| The safe choice is the primary button and takes DOM order, so a stray Enter
| or Tab does not destroy anything.
*/

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    /** What exactly is affected — never generic. */
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'neutral';
    processing?: boolean;
    onConfirm: () => void;
    onClose: () => void;
    /** Extra content, e.g. a required "reason" textarea. */
    children?: ReactNode;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Удалить',
    cancelLabel = 'Отмена',
    tone = 'danger',
    processing = false,
    onConfirm,
    onClose,
    children,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} size="sm" title={title} hideCloseButton={processing}>
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                        tone === 'danger'
                            ? 'border-danger/40 bg-danger/10 text-danger'
                            : 'border-border bg-bg-secondary text-text-secondary',
                    )}
                    aria-hidden="true"
                >
                    <AlertIcon className="h-5 w-5" />
                </span>

                <div className="min-w-0 text-sm leading-relaxed text-text-secondary">{message}</div>
            </div>

            {children !== undefined && <div className="mt-5">{children}</div>}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                    type="button"
                    variant={tone === 'danger' ? 'ghost' : 'primary'}
                    onClick={onConfirm}
                    loading={processing}
                    disabled={processing}
                    fullWidth
                    className={cn(
                        'sm:w-auto',
                        tone === 'danger' &&
                            'border-danger/50 text-danger hover:border-danger hover:text-danger',
                    )}
                >
                    {confirmLabel}
                </Button>

                <Button
                    type="button"
                    variant={tone === 'danger' ? 'primary' : 'ghost'}
                    onClick={onClose}
                    disabled={processing}
                    fullWidth
                    className="sm:w-auto"
                >
                    {cancelLabel}
                </Button>
            </div>
        </Modal>
    );
}

export default ConfirmDialog;
