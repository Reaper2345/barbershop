import { useEffect, useState, type FormEvent } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/Components/Layout/AdminLayout';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { AlertIcon, CheckCircleIcon, InfoIcon } from '@/lib/icons';
import { masterNav } from '@/lib/nav';
import { routes } from '@/lib/routes';
import { masterPhoto } from '@/lib/image';
import type { SharedProps } from '@/types';

/*
|--------------------------------------------------------------------------
| Master/Profile/Edit — GET/PUT /master/profile
|--------------------------------------------------------------------------
| The master may change exactly one thing here: his login email.
|
| Everything else — name, phone, photo, bio and experience — is shown for
| reference only and is edited by an administrator (Admin\Masters\Form). The
| server enforces this independently: UpdateMasterProfileRequest only accepts
| `email`, and MasterProfileController@update writes nothing else, so posting
| the old bio/experience/photo payload has no effect.
*/

export interface MasterProfileProps {
    /** Raw storage path, resolved through masterPhoto(). */
    photo_url?: string | null;
    bio?: string | null;
    experience_years?: number;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
}

interface ProfileForm {
    email: string;
}

export default function MasterProfile({
    photo_url = null,
    bio = null,
    experience_years = 0,
    name = null,
    phone = null,
    email = null,
}: MasterProfileProps) {
    const { flash } = usePage<SharedProps>().props;

    const form = useForm<ProfileForm>({ email: email ?? '' });

    /*
     * The success flash («Email обновлён.») arrives on the redirected GET, but
     * AdminLayout does not render the public toast region, so the page shows it
     * itself.
     */
    const [flashText, setFlashText] = useState<string | null>(flash?.success ?? null);

    useEffect(() => {
        setFlashText(flash?.success ?? null);
    }, [flash?.success]);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // No files in this payload, so a real PUT is fine — the POST +
        // `_method=put` dance was only needed while the photo was uploaded here.
        form.put(routes.masterArea.profile, { preserveScroll: true });
    };

    const hasPhoto = photo_url !== null && photo_url !== undefined && photo_url !== '';

    /** One read-only fact row. */
    const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/60 py-3 last:border-b-0">
            <dt className="w-40 shrink-0 text-xs uppercase tracking-wider text-text-secondary">
                {label}
            </dt>
            <dd className="min-w-0 flex-1 text-sm text-text-primary">{value}</dd>
        </div>
    );

    return (
        <AdminLayout
            title="Мой профиль"
            subtitle="Здесь меняется только email. Остальные данные правки администратор."
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

            {/* Read-only profile */}
            <section
                className="max-w-3xl rounded-2xl border border-border bg-bg-elevated p-6"
                aria-labelledby="profile-readonly-heading"
            >
                <h2
                    id="profile-readonly-heading"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-accent"
                >
                    Данные мастера
                </h2>

                <div className="mt-5 flex flex-wrap items-start gap-6">
                    <div className="h-32 w-26 shrink-0 overflow-hidden rounded-xl border border-border bg-bg-secondary">
                        <img
                            src={masterPhoto(photo_url, name)}
                            alt="Фото мастера"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <dl className="min-w-[16rem] flex-1">
                        <ReadOnlyRow label="Имя" value={name ?? '—'} />
                        <ReadOnlyRow label="Телефон" value={phone ?? '—'} />
                        <ReadOnlyRow
                            label="Опыт работы"
                            value={`${experience_years} ${experience_years === 1 ? 'год' : experience_years < 5 ? 'года' : 'лет'}`}
                        />
                        <ReadOnlyRow label="О себе" value={bio ?? '—'} />
                    </dl>
                </div>

                <p className="mt-5 flex items-start gap-2 text-xs text-text-secondary">
                    <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    Эти данные изменяет администратор.
                    {hasPhoto ? '' : ' Фотографию также загружает администратор.'}
                </p>
            </section>

            {/* The only editable field */}
            <form onSubmit={submit} className="mt-8 max-w-3xl space-y-6" noValidate>
                <fieldset className="min-w-0 space-y-6 rounded-2xl border border-border bg-bg-elevated p-6">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Данные для входа
                    </legend>

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        maxLength={255}
                        placeholder="master@example.com"
                        value={form.data.email}
                        error={form.errors.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                    />

                    <p className="flex items-start gap-2 text-xs text-text-secondary">
                        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        Email используется для входа в кабинет. Пароль меняется администратором.
                    </p>
                </fieldset>

                {form.hasErrors && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        Проверьте выделенные поля.
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
