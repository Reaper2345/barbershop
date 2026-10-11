import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/Components/UI/Input';
import { PhoneInput } from '@/Components/UI/PhoneInput';
import { Textarea } from '@/Components/UI/Textarea';
import { Button } from '@/Components/UI/Button';
import { CheckCircleIcon } from '@/lib/icons';
import { CONTACT_COPY } from '@/lib/content';
import { routes } from '@/lib/routes';

/*
|--------------------------------------------------------------------------
| CallbackForm
|--------------------------------------------------------------------------
| The "Заказать звонок" form itself, extracted so it can be used in two
| places without duplication:
|   - inside CallbackModal (header / footer trigger),
|   - inline on the contacts page.
|
| Posts to /call-request (LeadController@store), whose rules are:
|   name (2–100), phone (chars +0-9()\- and spaces, 6–32), comment (≤1000)
|   and the `website` honeypot, which must stay empty.
*/

interface CallbackFormData {
    name: string;
    phone: string;
    comment: string;
    /** Honeypot — hidden from people, filled by bots. */
    website: string;
}

export interface CallbackFormProps {
    /** Called after a successful POST, e.g. to close the modal. */
    onSuccess?: () => void;
    /** Renders the cancel button when provided. */
    onCancel?: () => void;
    /** `compact` drops the intro paragraph for the inline contacts form. */
    variant?: 'default' | 'compact';
    className?: string;
}

export function CallbackForm({
    onSuccess,
    onCancel,
    variant = 'default',
    className,
}: CallbackFormProps) {
    const form = useForm<CallbackFormData>({
        name: '',
        phone: '',
        comment: '',
        website: '',
    });
    const [succeeded, setSucceeded] = useState(false);

    useEffect(() => {
        if (!form.recentlySuccessful) {
            return;
        }

        setSucceeded(true);
        form.reset('name', 'phone', 'comment');
        onSuccess?.();
    }, [form.recentlySuccessful]); // eslint-disable-line react-hooks/exhaustive-deps

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post(routes.callRequest, {
            preserveScroll: true,
            onStart: () => setSucceeded(false),
        });
    };

    if (succeeded) {
        return (
            <div className={['flex flex-col items-center py-8 text-center', className ?? ''].join(' ')}>
                <CheckCircleIcon className="h-12 w-12 text-success" aria-hidden="true" />

                <p className="mt-4 font-display text-xl font-semibold text-text-primary">
                    {CONTACT_COPY.success}
                </p>

                <p className="mt-2 max-w-sm text-sm text-text-secondary">
                    {CONTACT_COPY.successText}
                </p>

                <Button
                    variant="ghost"
                    className="mt-6"
                    onClick={() => {
                        form.reset();
                        setSucceeded(false);
                    }}
                >
                    Отправить ещё одну заявку
                </Button>
            </div>
        );
    }

    return (
        <form
            onSubmit={submit}
            className={['space-y-5', className ?? ''].join(' ')}
            noValidate
        >
            {variant === 'default' && (
                <p className="text-sm leading-relaxed text-text-secondary">
                    {CONTACT_COPY.callbackText}
                </p>
            )}

            <Input
                label={CONTACT_COPY.name}
                name="name"
                autoComplete="name"
                placeholder="Как к вам обращаться"
                required
                value={form.data.name}
                error={form.errors.name}
                onChange={(event) => form.setData('name', event.target.value)}
            />

            <PhoneInput
                label={CONTACT_COPY.phone}
                name="phone"
                placeholder="+7 (___) ___-__-__"
                required
                value={form.data.phone}
                error={form.errors.phone}
                onChange={(value) => form.setData('phone', value)}
            />

            <Textarea
                label={CONTACT_COPY.comment}
                name="comment"
                rows={3}
                placeholder="Удобное время для звонка, вопрос"
                value={form.data.comment}
                error={form.errors.comment}
                onChange={(event) => form.setData('comment', event.target.value)}
            />

            <div className="hidden" aria-hidden="true">
                <label htmlFor="callback-honeypot">Website</label>
                <input
                    id="callback-honeypot"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.data.website}
                    onChange={(event) => form.setData('website', event.target.value)}
                />
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
                <Button
                    type="submit"
                    variant="primary"
                    loading={form.processing}
                    fullWidth
                    className="sm:w-auto"
                >
                    {CONTACT_COPY.submit}
                </Button>

                {onCancel !== undefined && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        fullWidth
                        className="sm:w-auto"
                    >
                        Отмена
                    </Button>
                )}
            </div>

            <p className="text-xs text-text-secondary">
                Нажимая «{CONTACT_COPY.submit}», вы соглашаетесь на обработку персональных данных.
            </p>
        </form>
    );
}

export default CallbackForm;
