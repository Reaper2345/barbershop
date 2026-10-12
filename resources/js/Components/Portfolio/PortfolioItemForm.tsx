import { useState, type FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { PhotoDropzone } from '@/Components/Booking/PhotoDropzone';
import { Button } from '@/Components/UI/Button';
import { MODAL_ACTIONS_CLASS } from '@/Components/UI/Modal';
import { Input } from '@/Components/UI/Input';
import { Select } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { AlertIcon, InfoIcon } from '@/lib/icons';
import { cn } from '@/lib/format';
import { portfolioPhoto } from '@/lib/image';
import type { PortfolioItemRow } from '@/types';

/*
|--------------------------------------------------------------------------
| PortfolioItemForm
|--------------------------------------------------------------------------
| Create + edit form shared by the admin and the master panel.
|
|   masters given   — admin panel: adds the "Мастер" select.
|   masters omitted — master panel: the controller pins master_id to the
|                     logged-in master, so there is nothing to choose.
|
| The photo is required on create and optional on edit; on edit the CURRENT
| photo is shown with a reset control, because `photo_path` is NOT NULL and a
| reset therefore falls back to the bundled placeholder rather than to null.
|
| Updates are submitted as POST + _method=put: the payload is multipart (the
| file), and PHP only parses a multipart body on POST.
*/

export interface PortfolioItemFormProps {
    /** null when creating. */
    item: PortfolioItemRow | null;
    /** Master options; omit to hide the select (master panel). */
    masters?: Array<{ id: number; name: string }>;
    /** Where the form posts. */
    action: string;
    /** "Отмена" target. */
    cancelHref: string;
    /**
     * Renders just the form — no page width cap, Cancel becomes a button — so it
     * can live in the modal opened from the list. The standalone create/edit
     * pages keep rendering the full page.
     */
    embedded?: boolean;
    /** Called after a successful save and by Cancel when embedded. */
    onDone?: () => void;
}

const DESCRIPTION_MAX = 2000;
const UPLOAD_PREFIX = 'portfolio/uploads/';

interface PortfolioForm {
    master_id: string;
    title: string;
    description: string;
    sort_order: string;
    is_published: boolean;
    photo: File | null;
    /** Set by «Сбросить фото»; the controller restores the placeholder. */
    remove_photo: boolean;
}

export function PortfolioItemForm({
    item,
    masters,
    action,
    cancelHref,
    embedded = false,
    onDone,
}: PortfolioItemFormProps) {
    const isEdit = item !== null;

    const form = useForm<PortfolioForm>({
        master_id: item === null ? (masters?.[0]?.id ?? '') .toString() : String(item.master_id),
        title: item?.title ?? '',
        description: item?.description ?? '',
        sort_order: String(item?.sort_order ?? 0),
        is_published: item?.is_published ?? true,
        photo: null,
        remove_photo: false,
    });

    const [localError, setLocalError] = useState<string | null>(null);

    const currentPhoto = item?.photo_path ?? null;
    // A bundled placeholder has no upload behind it, so there is nothing to
    // reset — only real uploads get the control.
    const canResetPhoto =
        currentPhoto !== null && currentPhoto.startsWith(UPLOAD_PREFIX);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (!isEdit && form.data.photo === null) {
            setLocalError('Загрузите фотографию работы.');

            return;
        }

        if (masters !== undefined && form.data.master_id === '') {
            setLocalError('Выберите мастера.');

            return;
        }

        setLocalError(null);

        const photo = form.data.photo;

        form.transform((data) => ({
            // `_method` spoofing is mandatory: the payload carries a File, so
            // Inertia sends multipart/form-data, and PHP only parses that on
            // POST. A genuine PUT would arrive with every field missing.
            ...(isEdit ? { _method: 'put' } : {}),
            ...(masters !== undefined ? { master_id: Number(data.master_id) } : {}),
            title: data.title === '' ? null : data.title,
            description: data.description === '' ? null : data.description,
            sort_order: Number(data.sort_order === '' ? 0 : data.sort_order),
            is_published: data.is_published ? 1 : 0,
            remove_photo: data.remove_photo ? 1 : 0,
            // Only send the file when a new one was picked.
            ...(photo !== null ? { photo } : {}),
        }));

        form.post(action, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onDone?.(),
        });
    };

    return (
        <form
            onSubmit={submit}
            className={cn('space-y-8', embedded ? 'w-full' : 'max-w-3xl')}
            noValidate
        >
            <fieldset className="space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Работа
                </legend>

                {masters !== undefined && (
                    <Select
                        label="Мастер"
                        name="master_id"
                        required
                        options={masters.map((master) => ({
                            value: master.id,
                            label: master.name,
                        }))}
                        placeholder="Выберите мастера"
                        value={form.data.master_id}
                        error={form.errors.master_id}
                        onChange={(event) => form.setData('master_id', event.target.value)}
                    />
                )}

                <Input
                    label="Заголовок"
                    name="title"
                    maxLength={120}
                    placeholder="Классический фейд"
                    value={form.data.title}
                    error={form.errors.title}
                    onChange={(event) => form.setData('title', event.target.value)}
                />

                <div>
                    <Textarea
                        label="Описание"
                        name="description"
                        rows={4}
                        maxLength={DESCRIPTION_MAX}
                        placeholder="Что сделано, какая техника, сколько времени заняло"
                        value={form.data.description}
                        error={form.errors.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                    />

                    <p className="mt-1 text-right text-xs tabular-nums text-text-secondary">
                        {form.data.description.length} / {DESCRIPTION_MAX}
                    </p>
                </div>

                <Input
                    label="Порядок вывода"
                    name="sort_order"
                    type="number"
                    min={0}
                    step={1}
                    value={form.data.sort_order}
                    error={form.errors.sort_order}
                    hint="Меньше — выше в списке"
                    onChange={(event) => form.setData('sort_order', event.target.value)}
                />

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm">
                    <input
                        type="checkbox"
                        checked={form.data.is_published}
                        onChange={(event) => form.setData('is_published', event.target.checked)}
                        className="h-4 w-4 rounded border-border bg-bg-elevated text-accent focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <span className="text-text-primary">
                        Показывать на сайте
                        <span className="ml-2 text-xs text-text-secondary">
                            черновик виден только в панели
                        </span>
                    </span>
                </label>
            </fieldset>

            <fieldset className="space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Фотография
                </legend>

                <PhotoDropzone
                    value={form.data.photo}
                    onChange={(file) =>
                        // Functional form: setData(object) REPLACES the whole
                        // state and would silently wipe the other fields.
                        form.setData((current) => ({
                            ...current,
                            photo: file,
                            remove_photo: false,
                        }))
                    }
                    error={form.errors.photo}
                    label="Фото работы"
                    hint="Квадратное изображение, JPG/PNG/WEBP/SVG, до 5 МБ"
                />

                {currentPhoto !== null && (
                    <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                        {form.data.remove_photo ? (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-text-secondary">
                                    Фото будет заменено на стандартную заглушку после
                                    сохранения.
                                </p>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        form.setData((current) => ({
                                            ...current,
                                            remove_photo: false,
                                        }))
                                    }
                                >
                                    Отменить
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="block h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-bg-elevated">
                                    <img
                                        src={portfolioPhoto(currentPhoto)}
                                        alt="Текущая фотография работы"
                                        className="h-full w-full object-cover"
                                    />
                                </span>

                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-text-primary">
                                        Текущее фото
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        {canResetPhoto
                                            ? 'Выберите новый файл выше, чтобы заменить его.'
                                            : 'Стандартная заглушка из комплекта сайта.'}
                                    </p>
                                </div>

                                {canResetPhoto && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="ml-auto border-danger/50 text-danger hover:border-danger hover:text-danger"
                                        onClick={() =>
                                            form.setData((current) => ({
                                                ...current,
                                                photo: null,
                                                remove_photo: true,
                                            }))
                                        }
                                    >
                                        Сбросить фото
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <p className="flex items-start gap-2 text-xs text-text-secondary">
                    <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    Работа видна в публичном портфолио и на странице мастера, пока включена
                    публикация.
                </p>
            </fieldset>

            {(localError !== null || form.hasErrors) && (
                <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                    {localError ?? 'Проверьте выделенные поля.'}
                </p>
            )}

            <div className={embedded ? MODAL_ACTIONS_CLASS : 'flex flex-wrap items-center gap-3'}>
                <Button type="submit" loading={form.processing} size="lg">
                    Сохранить
                </Button>

                {embedded ? (
                    <Button type="button" variant="ghost" onClick={() => onDone?.()}>
                        Отмена
                    </Button>
                ) : (
                    <Link
                        href={cancelHref}
                        className="text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                    >
                        Отмена
                    </Link>
                )}
            </div>
        </form>
    );
}

export default PortfolioItemForm;
