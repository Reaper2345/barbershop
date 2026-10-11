import type { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AuthLayout, AuthPerks } from '@/Components/Layout/AuthLayout';
import { Input } from '@/Components/UI/Input';
import { Button } from '@/Components/UI/Button';
import { AUTH_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';

/*
|--------------------------------------------------------------------------
| Auth/Login — GET /login
|--------------------------------------------------------------------------
| Minimal centred form: email, password, "remember me", submit.
|
| The POST target is declared in lib/routes.ts. The auth controllers land in
| PROMPT 5, so until then a submit will 404 — that is expected for this
| prompt, which builds the design system and the public pages only.
*/

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        post(routes.login, {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title={AUTH_COPY.loginTitle}
            subtitle={AUTH_COPY.loginSubtitle}
            footer={
                <>
                    Нет аккаунта?{' '}
                    <Link
                        href={routes.register}
                        className="font-medium text-accent transition-all duration-300 hover:text-accent-hover"
                    >
                        Зарегистрироваться
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-5" noValidate>
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
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={data.password}
                    error={errors.password}
                    onChange={(event) => setData('password', event.target.value)}
                />

                <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        />
                        Запомнить меня
                    </label>

                    <span className="text-sm text-text-secondary/70">
                        Восстановление пароля — по звонку
                    </span>
                </div>

                <Button type="submit" fullWidth size="lg" loading={processing}>
                    Войти
                </Button>
            </form>

            <div className="mt-8 border-t border-border pt-6">
                <AuthPerks
                    items={[
                        'Онлайн-запись 24/7 без звонков',
                        'История визитов и повторная запись в один клик',
                    ]}
                />
            </div>
        </AuthLayout>
    );
}
