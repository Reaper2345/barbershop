import type { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AuthLayout, AuthPerks } from '@/Components/Layout/AuthLayout';
import { Input } from '@/Components/UI/Input';
import { PhoneInput } from '@/Components/UI/PhoneInput';
import { Button } from '@/Components/UI/Button';
import { AUTH_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';

/*
|--------------------------------------------------------------------------
| Auth/Register — GET /register
|--------------------------------------------------------------------------
| name, phone, email, password, password_confirmation. The password fields are
| checked client-side for an exact match before the request is sent; Laravel
| re-validates with `confirmed` on the server once the controller exists
| (PROMPT 5).
*/

interface RegisterForm {
    name: string;
    phone: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset, setError, clearErrors } =
        useForm<RegisterForm>({
            name: '',
            phone: '',
            email: '',
            password: '',
            password_confirmation: '',
        });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // Mirror Laravel's `confirmed` rule so the user gets an immediate
        // answer instead of a round trip.
        if (data.password !== data.password_confirmation) {
            setError('password_confirmation', 'Пароли не совпадают.');

            return;
        }

        clearErrors('password_confirmation');

        post(routes.register, {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={AUTH_COPY.registerTitle}
            subtitle={AUTH_COPY.registerSubtitle}
            footer={
                <>
                    Уже есть аккаунт?{' '}
                    <Link
                        href={routes.login}
                        className="font-medium text-accent transition-all duration-300 hover:text-accent-hover"
                    >
                        Войти
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-5" noValidate>
                <Input
                    label="Имя"
                    name="name"
                    autoComplete="name"
                    placeholder="Иван"
                    required
                    value={data.name}
                    error={errors.name}
                    onChange={(event) => setData('name', event.target.value)}
                />

                <PhoneInput
                    label="Телефон"
                    name="phone"
                    placeholder="+7 (___) ___-__-__"
                    required
                    value={data.phone}
                    error={errors.phone}
                    onChange={(value) => setData('phone', value)}
                />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    value={data.email}
                    error={errors.email}
                    onChange={(event) => setData('email', event.target.value)}
                />

                <Input
                    label="Пароль"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    value={data.password}
                    error={errors.password}
                    hint="Минимум 8 символов."
                    onChange={(event) => setData('password', event.target.value)}
                />

                <Input
                    label="Повторите пароль"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    value={data.password_confirmation}
                    error={errors.password_confirmation}
                    onChange={(event) =>
                        setData('password_confirmation', event.target.value)
                    }
                />

                <Button type="submit" fullWidth size="lg" loading={processing}>
                    Создать аккаунт
                </Button>
            </form>

            <div className="mt-8 border-t border-border pt-6">
                <AuthPerks
                    items={[
                        'Онлайн-запись и перенос визита без звонков',
                        'Напоминание о визите в день записи',
                    ]}
                />
            </div>
        </AuthLayout>
    );
}
