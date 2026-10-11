import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { AlertIcon, CloseIcon, InfoIcon } from '@/lib/icons';
import { cn } from '@/lib/format';

/*
|--------------------------------------------------------------------------
| FileUpload
|--------------------------------------------------------------------------
| Image picker with drag & drop and a live preview — used for the master
| profile photo (stored on the `public` disk under masters/).
|
| The client-side checks mirror the server rules (`image`,
| `mimes:jpg,jpeg,png,webp`, `max:5120`). The server re-validates regardless,
| and any error it returns is shown next to the field via `error`.
|
| An existing image is shown as the preview until a new file is chosen, so the
| admin can see what is being replaced.
*/

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export interface FileUploadProps {
    /** Newly chosen file, or null when unchanged. */
    value: File | null;
    onChange: (file: File | null) => void;
    /** Existing image URL to show before a new file is chosen. */
    currentUrl?: string | null;
    label?: string;
    hint?: string;
    error?: string;
    /** FormData field name. */
    name?: string;
    disabled?: boolean;
    className?: string;
}

export function FileUpload({
    value,
    onChange,
    currentUrl = null,
    label = 'Фотография',
    hint = 'JPG, PNG или WEBP, до 5 МБ. Соотношение 4:5 выглядит лучше всего.',
    error,
    name = 'photo',
    disabled = false,
    className,
}: FileUploadProps) {
    const inputId = `file-${useId().replace(/:/g, '')}`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (value === null) {
            setPreviewUrl(null);

            return;
        }

        const url = URL.createObjectURL(value);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [value]);

    const accept = (file: File | undefined): void => {
        if (file === undefined) {
            return;
        }

        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

        // Some cameras report an empty MIME type, so the extension is a second
        // signal rather than a replacement.
        const typeOk =
            ACCEPTED_MIME.includes(file.type) ||
            (file.type === '' && ACCEPTED_EXTENSIONS.includes(extension));

        if (!typeOk) {
            setLocalError('Подойдёт файл JPG, PNG или WEBP.');

            return;
        }

        if (file.size > MAX_BYTES) {
            setLocalError(
                `Файл больше 5 МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ). Выберите изображение поменьше.`,
            );

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

    const shown = previewUrl ?? currentUrl;
    const shownError = localError ?? error ?? null;

    return (
        <div className={className}>
            <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>

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
                    'flex flex-col gap-4 rounded-2xl border border-dashed p-5 transition-all duration-300 sm:flex-row sm:items-center',
                    dragging ? 'border-accent bg-accent/5' : 'border-border bg-bg-secondary',
                    disabled && 'opacity-60',
                )}
            >
                {/* Preview */}
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-bg-elevated">
                    {shown !== null && shown !== '' ? (
                        <img
                            src={shown}
                            alt="Предпросмотр фотографии мастера"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span
                            className="flex h-full w-full items-center justify-center text-text-secondary"
                            aria-hidden="true"
                        >
                            <InfoIcon className="h-6 w-6" />
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-secondary">
                        Перетащите изображение сюда или{' '}
                        <label
                            htmlFor={inputId}
                            className="cursor-pointer font-medium text-accent underline underline-offset-4 transition-all duration-300 hover:text-accent-hover"
                        >
                            выберите файл
                        </label>
                    </p>

                    <p className="mt-1 text-xs text-text-secondary/70">{hint}</p>

                    {value !== null && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-text-primary">
                            <span className="truncate">{value.name}</span>
                            <button
                                type="button"
                                onClick={clear}
                                disabled={disabled}
                                aria-label="Отменить выбор файла"
                                className="rounded-full border border-border p-1 text-text-secondary transition-all duration-300 hover:border-danger hover:text-danger focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                <CloseIcon className="h-3.5 w-3.5" />
                            </button>
                        </p>
                    )}
                </div>

                <input
                    ref={inputRef}
                    id={inputId}
                    name={name}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
                    disabled={disabled}
                    className="sr-only"
                    aria-invalid={shownError !== null || undefined}
                    aria-describedby={shownError !== null ? `${inputId}-error` : undefined}
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

export default FileUpload;
