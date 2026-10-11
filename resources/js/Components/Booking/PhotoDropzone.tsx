import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { AlertIcon, CloseIcon, InfoIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| PhotoDropzone
|--------------------------------------------------------------------------
| Optional reference photo for the booking request (the master uses it to quote
| an exact price). Two ways in: click/keyboard through a real file input, or
| drag and drop.
|
| The client-side checks mirror StoreAppointmentRequest exactly
| (`image`, `mimes:jpg,jpeg,png,webp`, `max:5120`) so the user is told about a
| problem before anything is uploaded. The server re-validates regardless.
*/

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export interface PhotoDropzoneProps {
    value: File | null;
    onChange: (file: File | null) => void;
    /** Server-side validation message, shown alongside local ones. */
    error?: string;
    /** Field name used by the underlying input, so FormData carries it. */
    name?: string;
    /** Field label. Defaults to the booking wording. */
    label?: string;
    /** Small print under the drop area. Defaults to the booking wording. */
    hint?: string;
    disabled?: boolean;
    className?: string;
}

export function PhotoDropzone({
    value,
    onChange,
    error,
    name = 'photo',
    label = 'Фотография (необязательно)',
    hint = 'JPG, PNG или WEBP, до 5 МБ. Поможет мастеру назвать точную цену.',
    disabled = false,
    className,
}: PhotoDropzoneProps) {
    const inputId = `photo-${useId().replace(/:/g, '')}`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Object URLs must be revoked or they leak the whole image for the page's
    // lifetime.
    useEffect(() => {
        if (value === null) {
            setPreviewUrl(null);

            return;
        }

        const url = URL.createObjectURL(value);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [value]);

    const validate = (file: File): string | null => {
        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

        // Some browsers report an empty MIME type for camera captures, so the
        // extension is accepted as a second signal.
        const typeOk =
            ACCEPTED_MIME.includes(file.type) ||
            (file.type === '' && ACCEPTED_EXTENSIONS.includes(extension));

        if (!typeOk) {
            return 'Подойдёт файл JPG, PNG или WEBP.';
        }

        if (file.size > MAX_BYTES) {
            return `Файл больше 5 МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ). Выберите изображение поменьше.`;
        }

        return null;
    };

    const accept = (file: File | undefined): void => {
        if (file === undefined) {
            return;
        }

        const problem = validate(file);

        if (problem !== null) {
            setLocalError(problem);
            // Keep the input in sync so the same file can be re-picked.
            if (inputRef.current !== null) {
                inputRef.current.value = '';
            }

            return;
        }

        setLocalError(null);
        onChange(file);
    };

    const clear = (): void => {
        onChange(null);
        setLocalError(null);

        if (inputRef.current !== null) {
            inputRef.current.value = '';
        }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setDragging(false);

        if (disabled) {
            return;
        }

        accept(event.dataTransfer.files[0]);
    };

    const shownError = localError ?? error ?? null;

    return (
        <div className={className}>
            <span className="mb-2 block text-sm font-medium text-text-primary">
                {label}
            </span>

            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    if (!disabled) {
                        setDragging(true);
                    }
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    'rounded-2xl border border-dashed p-5 transition-all duration-300',
                    dragging ? 'border-accent bg-accent/5' : 'border-border bg-bg-secondary',
                    disabled && 'opacity-60',
                )}
            >
                {value !== null && previewUrl !== null ? (
                    <div className="flex items-center gap-4">
                        <img
                            src={previewUrl}
                            alt="Предпросмотр выбранной фотографии"
                            className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-primary">
                                {value.name}
                            </p>
                            <p className="mt-1 text-xs text-text-secondary">
                                {(value.size / 1024 / 1024).toFixed(2)} МБ · нажмите «Удалить», чтобы выбрать другую
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={clear}
                            disabled={disabled}
                            aria-label="Удалить выбранную фотографию"
                            className="rounded-full border border-border p-2 text-text-secondary transition-all duration-300 hover:border-danger hover:text-danger focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                        <InfoIcon className="h-6 w-6 text-accent" aria-hidden="true" />

                        <p className="text-sm text-text-secondary">
                            Перетащите фото сюда или{' '}
                            <label
                                htmlFor={inputId}
                                className="cursor-pointer font-medium text-accent underline underline-offset-4 transition-all duration-300 hover:text-accent-hover"
                            >
                                выберите файл
                            </label>
                        </p>

                        <p className="text-xs text-text-secondary/70">
                            {hint}
                        </p>
                    </div>
                )}

                <input
                    ref={inputRef}
                    id={inputId}
                    name={name}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
                    disabled={disabled}
                    className="sr-only"
                    aria-describedby={shownError !== null ? `${inputId}-error` : undefined}
                    aria-invalid={shownError !== null || undefined}
                    onChange={(event) => accept(event.target.files?.[0])}
                />
            </div>

            {shownError !== null && (
                <p
                    id={`${inputId}-error`}
                    role="alert"
                    className="mt-2 flex items-center gap-1.5 text-xs text-danger"
                >
                    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                    {shownError}
                </p>
            )}
        </div>
    );
}

export default PhotoDropzone;
