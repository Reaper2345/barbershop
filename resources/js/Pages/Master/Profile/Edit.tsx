import { useEffect, useState, type FormEvent } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PhotoDropzone } from '@/Components/Booking/PhotoDropzone';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Textarea } from '@/Components/UI/Textarea';
import { AlertIcon, CheckCircleIcon, InfoIcon } from '@/lib/icons';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { masterPhoto } from '@/lib/image';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Profile/Edit — GET/PUT /master/profile
|--------------------------------------------------------------------------
| Self-service profile for the logged-in master: his own photo, bio and
| experience. The linked User row (name, email) is read-only here — only an
| administrator can change it — and the controller never writes to it.
|
| The PUT route is submitted as POST + `_method: put`. This is required, not
| cosmetic: the payload may carry a File, Inertia then sends
| multipart/form-data, and PHP only parses a multipart body on POST. A genuine
| PUT arrives with every field missing (the admin master form hit exactly this
| bug).
*/

export interface MasterProfileProps {
    /** Raw storage path, resolved through masterPhoto(). */
    photo_url?: string | null;
    bio?: string | null;
    experience_years?: number;
    name?: string | null;
    email?: string | null;
}

const BIO_MAX = 2000;

interface ProfileForm {
    bio: string;
    experience_years: string;
    photo: File | null;
    /** Set by «Удалить фото»; the controller clears the column when true. */
    remove_photo: boolean;
}

export default function MasterProfile({
    photo_url = null,
    bio = null,
    experience_years = 0,
    name = null,
    email = null,
}: MasterProfileProps) {
    const { flash } = usePage<SharedProps>().props;

    const form = useForm<ProfileForm>({
        bio: bio ?? '',
        experience_years: String(experience_years),
        photo: null,
        remove_photo: false,
    });

    const [localError, setLocalError] = useState<string | null>(null);

    /*
     * The success flash arrives on the redirected GET, but AdminLayout does not
     * render the public toast region, so the page shows it itself.
     */
    const [flashText, setFlashText] = useState<string | null>(flash?.success ?? null);

    useEffect(() => {
        setFlashText(flash?.success ?? null);
    }, [flash?.success]);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const years = form.data.experience_years === '' ? Number.NaN : Number(form.data.experience_years);

        if (Number.isNaN(years) || years < 0 || years > 60) {
            setLocalError('Опыт работы указывается целым числом от 0 до 60 лет.');

            return;
        }

        setLocalError(null);

        form.transform((data) => ({
            _method: 'put',
            bio: data.bio,
            experience_years: Number(data.experience_years === '' ? 0 : data.experience_years),
            remove_photo: data.remove_photo ? 1 : 0,
            // Only send the file when a new one was picked; the controller keeps
            // the existing path otherwise.
            ...(data.photo !== null ? { photo: data.photo } : {}),
        }));

        form.post(routes.masterArea.profile, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const hasCurrentPhoto = photo_url !== null && photo_url !== undefined && photo_url !== '';

    return (
        <AdminLayout
            title="Мой профиль"
            subtitle="Фото, описание и опыт видны клиентам на странице мастеров."
            nav={masterNav}
            breadcrumbs={[{ label: 'Кабинет мастера' }, { label: 'Мой профиль' }]}
        >
            <Head title="Мой профиль" />

            {flashText !== null && (
                <p
                    role="status"
                    className="mb-8 flex items-center gap-2 rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
                >
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    {flashText}
                </p>
            )}

            <form onSubmit={submit} className="max-w-3xl space-y-8" noValidate>
                {/* Photo */}
                <fieldset className="space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Фотография
                    </legend>

                    <PhotoDropzone
                        value={form.data.photo}
                        onChange={(file) =>
                            // Functional form: setData(object) REPLACES the whole
                            // form state and would silently drop bio and
                            // experience_years.
                            form.setData((current) => ({
                                ...current,
                                photo: file,
                                remove_photo: false,
                            }))
                        }
                        error={form.errors.photo}
                        label="Фото мастера"
                        hint="Рекомендуемый размер: 400×500, JPG или PNG, до 5 МБ"
                    />

                    {/*
                     * The current photo lives outside the dropzone so removal has
                     * an explicit control: the dropzone only ever describes a
                     * file that was just picked.
                     */}
                    {hasCurrentPhoto && (
                        <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                            {form.data.remove_photo ? (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-text-secondary">
                                        Фото будет удалено после сохранения.
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
                                        Отменить удаление
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-4">
                                    <img
                                        src={masterPhoto(photo_url, name)}
                                        alt="Текущее фото мастера"
                                        className="h-24 w-20 shrink-0 rounded-xl border border-border object-cover"
                                    />

                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">
                                            Текущее фото
                                        </p>
                                        <p className="mt-1 text-xs text-text-secondary">
                                            Выберите новый файл выше, чтобы заменить его.
                                        </p>
                                    </div>

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
                                        Удалить фото
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </fieldset>

                {/* Identity — read-only */}
                <div className="rounded-2xl border border-border bg-bg-elevated p-6">
                    <p className="text-xs uppercase tracking-wider text-text-secondary">
                        Учётная запись
                    </p>

                    <p className="mt-3 text-sm text-text-primary">{name ?? '—'}</p>
                    <p className="text-xs text-text-secondary">{email ?? ''}</p>

                    <p className="mt-4 flex items-start gap-2 text-xs text-text-secondary">
                        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        Имя и email изменяются только администратором.
                    </p>
                </div>

                {/* Editable profile */}
                <fieldset className="space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        О мастере
                    </legend>

                    <div>
                        <Textarea
                            label="О себе"
                            name="bio"
                            rows={6}
                            maxLength={BIO_MAX}
                            placeholder="Специализация, опыт, любимые техники"
                            value={form.data.bio}
                            error={form.errors.bio}
                            onChange={(event) => form.setData('bio', event.target.value)}
                        />

                        <p className="mt-1 text-right text-xs text-text-secondary tabular-nums">
                            {form.data.bio.length} / {BIO_MAX}
                        </p>
                    </div>

                    <Input
                        label="Опыт работы, лет"
                        name="experience_years"
                        type="number"
                        min={0}
                        max={60}
                        step={1}
                        required
                        value={form.data.experience_years}
                        error={form.errors.experience_years}
                        onChange={(event) => form.setData('experience_years', event.target.value)}
                    />
                </fieldset>

                {(localError !== null || form.hasErrors) && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {localError ?? 'Проверьте выделенные поля.'}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" loading={form.processing} size="lg">
                        Сохранить
                    </Button>

                    <Button href={routes.masterArea.dashboard} variant="ghost" size="lg">
                        Отмена
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
