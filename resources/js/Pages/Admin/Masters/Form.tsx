import { useState, type FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { PhotoDropzone } from '@/Components/Booking/PhotoDropzone';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { PhoneInput } from '@/Components/UI/PhoneInput';
import { Textarea } from '@/Components/UI/Textarea';
import { AlertIcon, InfoIcon } from '@/lib/icons';
import { buildAdminNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { PANEL } from '@/lib/panel-copy';
import { masterPhoto } from '@/lib/image';
import { cn } from '@/lib/format';
import type { AdminMasterRow } from '@/types';

/*
|--------------------------------------------------------------------------
| Admin/Masters/Form — create & edit
|--------------------------------------------------------------------------
| Two modes:
|
|   create — an email + password create the USER and assign the `master` role,
|            then the master profile is attached (Admin\MasterController@store).
|
|   edit   — only the profile fields; the linked account is already fixed.
|
| The photo is uploaded as a file (multipart) and stored on the `public` disk
| under masters/, so the submission switches to a FormData payload.
*/

export interface AdminMasterFormProps {
    master?: AdminMasterRow | null;
    /**
     * Renders just the <form> — no AdminLayout, no page heading — so the same
     * fields can live in the modal opened from /admin/masters. The standalone
     * routes stay reachable and keep rendering the full page.
     */
    embedded?: boolean;
    /** Called after a successful save and by the cancel control. */
    onDone?: () => void;
}

interface CreateForm {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    bio: string;
    experience_years: string;
    is_active: boolean;
    photo: File | null;
}

interface EditForm {
    bio: string;
    experience_years: string;
    is_active: boolean;
    photo: File | null;
    /** Set by «Удалить фото»; the controller clears the column when true. */
    remove_photo: boolean;
}

export default function AdminMasterForm({
    master = null,
    embedded = false,
    onDone,
}: AdminMasterFormProps) {
    const isEdit = master !== null;

    return isEdit ? (
        <EditMasterForm master={master} embedded={embedded} onDone={onDone} />
    ) : (
        <CreateMasterForm embedded={embedded} onDone={onDone} />
    );
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

function CreateMasterForm({
    embedded = false,
    onDone,
}: {
    embedded?: boolean;
    onDone?: () => void;
}) {
    const form = useForm<CreateForm>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        bio: '',
        experience_years: '1',
        is_active: true,
        photo: null,
    });

    const [localError, setLocalError] = useState<string | null>(null);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (form.data.password !== form.data.password_confirmation) {
            setLocalError('Пароли не совпадают.');

            return;
        }

        if (form.data.password.length < 8) {
            setLocalError('Пароль должен содержать не менее 8 символов.');

            return;
        }

        setLocalError(null);

        // `photo` is a File, so the whole payload must be multipart.
        form.transform((data) => ({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            password_confirmation: data.password_confirmation,
            bio: data.bio,
            experience_years: Number(data.experience_years === '' ? 0 : data.experience_years),
            is_active: data.is_active,
            photo: data.photo,
        }));

        form.post(routes.admin.masters, {
            forceFormData: true,
            onSuccess: () => onDone?.(),
        });
    };

    const body = (
        <>
            <form
                onSubmit={submit}
                className={cn('space-y-8', embedded ? 'w-full' : 'max-w-3xl')}
                noValidate
            >
                {/* Account */}
                <fieldset className="min-w-0 space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Учётная запись
                    </legend>

                    <Input
                        label="Имя и фамилия"
                        name="name"
                        required
                        autoComplete="name"
                        maxLength={255}
                        placeholder="Иван Соколов"
                        value={form.data.name}
                        error={form.errors.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                    />

                    <div className="grid gap-6 sm:grid-cols-2">
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="master@example.com"
                            value={form.data.email}
                            error={form.errors.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />

                        <PhoneInput
                            label="Телефон"
                            name="phone"
                            placeholder="+7 (___) ___-__-__"
                            value={form.data.phone}
                            error={form.errors.phone}
                            onChange={(value) => form.setData('phone', value)}
                        />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <Input
                            label="Пароль"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            placeholder="не менее 8 символов"
                            value={form.data.password}
                            error={form.errors.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                        />

                        <Input
                            label="Повторите пароль"
                            name="password_confirmation"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={form.data.password_confirmation}
                            error={form.errors.password_confirmation}
                            onChange={(event) =>
                                form.setData('password_confirmation', event.target.value)
                            }
                        />
                    </div>

                    <p className="flex items-start gap-2 text-xs text-text-secondary">
                        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        Передайте мастеру эти данные для входа. Роль «Мастер» назначается
                        автоматически и даёт доступ к разделу /master.
                    </p>
                </fieldset>

                {/* Profile */}
                <fieldset className="min-w-0 space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Профиль барбера
                    </legend>

                    <PhotoDropzone
                        value={form.data.photo}
                        onChange={(file) => form.setData('photo', file)}
                        error={form.errors.photo}
                        label="Фото мастера"
                        hint="Рекомендуемый размер: 400×500, JPG или PNG, до 5 МБ"
                    />

                    <Textarea
                        label="Описание"
                        name="bio"
                        rows={5}
                        maxLength={5000}
                        placeholder="Специализация, опыт, любимые техники"
                        value={form.data.bio}
                        error={form.errors.bio}
                        onChange={(event) => form.setData('bio', event.target.value)}
                    />

                    <Input
                        label="Опыт работы, лет"
                        name="experience_years"
                        type="number"
                        min={0}
                        max={80}
                        required
                        value={form.data.experience_years}
                        error={form.errors.experience_years}
                        onChange={(event) => form.setData('experience_years', event.target.value)}
                    />

                    <ActiveToggle
                        checked={form.data.is_active}
                        onChange={(value) => form.setData('is_active', value)}
                    />
                </fieldset>

                {(localError !== null || form.hasErrors) && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {localError ?? 'Проверьте выделенные поля.'}
                    </p>
                )}

                <FormActions processing={form.processing} isEdit={false} onCancel={onDone} />
            </form>
        </>
    );

    if (embedded) {
        return body;
    }

    return (
        <AdminLayout
            title="Новый мастер"
            subtitle="Создаётся учётная запись с ролью «Мастер» и профиль барбера."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Мастера', href: routes.admin.masters },
                { label: 'Создание' },
            ]}
        >
            <Head title="Новый мастер" />

            {body}
        </AdminLayout>
    );
}

/* ------------------------------------------------------------------ */
/* Edit                                                                */
/* ------------------------------------------------------------------ */

function EditMasterForm({
    master,
    embedded = false,
    onDone,
}: {
    master: AdminMasterRow;
    embedded?: boolean;
    onDone?: () => void;
}) {
    const form = useForm<EditForm>({
        bio: master.bio ?? '',
        experience_years: String(master.experience_years),
        is_active: master.is_active,
        photo: null,
        remove_photo: false,
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.transform((data) => ({
            /*
             * `_method` spoofing is mandatory here, not cosmetic. The payload
             * carries a File, so Inertia sends multipart/form-data — and PHP
             * only parses multipart bodies on POST. A genuine PUT arrived with
             * every field missing (the controller reported "опыт работы
             * обязательно" for a value that was sent, and the uploaded photo
             * was silently dropped). Posting with the override keeps the
             * request a POST on the wire and still hits PUT /admin/masters/{id}.
             */
            _method: 'put',
            bio: data.bio,
            experience_years: Number(data.experience_years === '' ? 0 : data.experience_years),
            is_active: data.is_active,
            remove_photo: data.remove_photo ? 1 : 0,
            // Only send the file when a new one was picked; the controller
            // keeps the existing path otherwise.
            ...(data.photo !== null ? { photo: data.photo } : {}),
        }));

        form.post(routes.admin.master(master.id), {
            forceFormData: true,
            onSuccess: () => onDone?.(),
        });
    };

    const body = (
        <>
            <form
                onSubmit={submit}
                className={cn('space-y-8', embedded ? 'w-full' : 'max-w-3xl')}
                noValidate
            >
                {/* Linked account, read-only */}
                <div className="rounded-2xl border border-border bg-bg-elevated p-6">
                    <p className="text-xs uppercase tracking-wider text-text-secondary">
                        Учётная запись
                    </p>

                    <p className="mt-3 text-sm text-text-primary">{master.user?.name ?? '—'}</p>
                    <p className="text-xs text-text-secondary">
                        {master.user?.email ?? ''}
                        {master.user?.phone !== null && master.user?.phone !== undefined
                            ? ` · ${master.user.phone}`
                            : ''}
                    </p>
                </div>

                <fieldset className="min-w-0 space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Профиль барбера
                    </legend>

                    <PhotoDropzone
                        value={form.data.photo}
                        onChange={(file) =>
                            // Functional form: setData(object) REPLACES the whole
                            // form state, which wiped bio/experience_years and
                            // posted experience_years as NaN.
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
                     * Current photo lives outside the dropzone so removal has an
                     * explicit control: the dropzone only ever describes a file
                     * the admin just picked.
                     */}
                    {master.photo !== null && master.photo !== undefined && (
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
                                        onClick={() => form.setData('remove_photo', false)}
                                    >
                                        Отменить удаление
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-4">
                                    <img
                                        src={masterPhoto(master.photo, master.user?.name)}
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

                    <Textarea
                        label="Описание"
                        name="bio"
                        rows={5}
                        maxLength={5000}
                        value={form.data.bio}
                        error={form.errors.bio}
                        onChange={(event) => form.setData('bio', event.target.value)}
                    />

                    <Input
                        label="Опыт работы, лет"
                        name="experience_years"
                        type="number"
                        min={0}
                        max={80}
                        required
                        value={form.data.experience_years}
                        error={form.errors.experience_years}
                        onChange={(event) => form.setData('experience_years', event.target.value)}
                    />

                    <ActiveToggle
                        checked={form.data.is_active}
                        onChange={(value) => form.setData('is_active', value)}
                    />
                </fieldset>

                {form.hasErrors && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        Проверьте выделенные поля.
                    </p>
                )}

                <FormActions processing={form.processing} isEdit onCancel={onDone} />
            </form>
        </>
    );

    if (embedded) {
        return body;
    }

    return (
        <AdminLayout
            title={`Мастер: ${master.user?.name ?? ''}`}
            subtitle="Профиль, опыт и фотография. Рейтинг рассчитывается по отзывам и не редактируется."
            nav={buildAdminNav()}
            breadcrumbs={[
                { label: 'Панель управления', href: routes.admin.dashboard },
                { label: 'Мастера', href: routes.admin.masters },
                { label: 'Редактирование' },
            ]}
        >
            <Head title="Профиль мастера" />

            {body}
        </AdminLayout>
    );
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function ActiveToggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label
            className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-300',
                checked ? 'border-accent/50 bg-accent/5' : 'border-border bg-bg-secondary',
            )}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-elevated text-accent focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="text-text-primary">
                Принимает записи
                <span className="ml-2 text-xs text-text-secondary">
                    отключённый мастер исчезает с сайта и не получает новые заявки
                </span>
            </span>
        </label>
    );
}

function FormActions({
    processing,
    isEdit,
    onCancel,
}: {
    processing: boolean;
    isEdit: boolean;
    /** Present inside the modal: cancelling closes it instead of navigating. */
    onCancel?: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={processing} size="lg">
                {isEdit ? PANEL.common.save : PANEL.common.create}
            </Button>

            {onCancel !== undefined ? (
                <Button type="button" variant="ghost" onClick={onCancel}>
                    {PANEL.common.cancel}
                </Button>
            ) : (
                <Link
                    href={routes.admin.masters}
                    className="text-sm text-text-secondary transition-all duration-300 hover:text-accent"
                >
                    {PANEL.common.back}
                </Link>
            )}
        </div>
    );
}
