import { useEffect, useState } from 'react';
import { Modal } from '@/Components/UI/Modal';
import { CallbackForm } from '@/Components/Public/CallbackForm';
import { CheckCircleIcon } from '@/lib/icons';
import { CONTACT_COPY } from '@/lib/content';

/*
|--------------------------------------------------------------------------
| CallbackModal — "Заказать звонок"
|--------------------------------------------------------------------------
| A component rather than a page: it is mounted once in AppLayout and opened
| from the header, the footer and the mobile drawer. To avoid threading a
| context through every layout, the trigger is a tiny custom event on
| `window`; `openCallbackModal()` is the only API consumers need.
*/

const OPEN_EVENT = 'barbershop:open-callback';

/** Open the modal from anywhere. No-op during SSR. */
export function openCallbackModal(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function CallbackModal() {
    const [open, setOpen] = useState(false);
    const [succeeded, setSucceeded] = useState(false);

    // Listen for the global open event.
    useEffect(() => {
        const handleOpen = (): void => {
            setSucceeded(false);
            setOpen(true);
        };

        window.addEventListener(OPEN_EVENT, handleOpen);

        return () => window.removeEventListener(OPEN_EVENT, handleOpen);
    }, []);

    // The success screen is shown by CallbackForm; the modal closes itself a
    // moment later so the confirmation is readable but not blocking.
    useEffect(() => {
        if (!succeeded) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setOpen(false);
            setSucceeded(false);
        }, 2600);

        return () => window.clearTimeout(timeout);
    }, [succeeded]);

    const close = (): void => {
        setOpen(false);
        setSucceeded(false);
    };

    return (
        <Modal
            open={open}
            onClose={close}
            size="sm"
            title={succeeded ? undefined : CONTACT_COPY.callbackTitle}
        >
            {succeeded ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-success" aria-hidden="true" />

                    <p className="mt-4 font-display text-xl font-semibold text-text-primary">
                        {CONTACT_COPY.success}
                    </p>

                    <p className="mt-2 text-sm text-text-secondary">
                        {CONTACT_COPY.successText}
                    </p>
                </div>
            ) : (
                <CallbackForm onSuccess={() => setSucceeded(true)} onCancel={close} />
            )}
        </Modal>
    );
}

export default CallbackModal;
