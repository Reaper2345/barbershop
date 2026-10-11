import { forwardRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Input, type InputProps } from './Input';

/*
|--------------------------------------------------------------------------
| PhoneInput
|--------------------------------------------------------------------------
| Russian phone mask: everything the user types is reduced to at most ten
| significant digits and rendered as "+7 (999) 123-45-67".
|
| Two deliberate decisions:
|
|   - onChange receives the FORMATTED string, not the DOM event. Every caller
|     stores it straight into form state, so the backend always receives the
|     same shape.
|   - the stored value is rendered AS-IS. Re-formatting it on mount would
|     mangle a number the mask cannot express (a foreign number saved through
|     a settings text field), and the value only has to be canonical once the
|     user actually edits the field.
*/

/** Significant digits only: drops a leading 7/8 and caps the rest at ten. */
function significantDigits(input: string): string {
    let digits = input.replace(/\D/g, '');

    if (digits === '') {
        return '';
    }

    // 7 = country code, 8 = the old trunk prefix. Neither is "significant".
    if (digits.startsWith('7') || digits.startsWith('8')) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 10);
}

/** "+7 (999) 123-45-67" from the ten significant digits (partial input allowed). */
function maskDigits(rest: string): string {
    if (rest === '') {
        return '';
    }

    let out = `+7 (${rest.slice(0, 3)}`;

    if (rest.length >= 3) {
        out += ')';
    }

    if (rest.length > 3) {
        out += ` ${rest.slice(3, 6)}`;
    }

    if (rest.length > 6) {
        out += `-${rest.slice(6, 8)}`;
    }

    if (rest.length > 8) {
        out += `-${rest.slice(8, 10)}`;
    }

    return out;
}

/** Public helper: formats any phone-ish string. "" stays "". */
export function formatPhone(input: string): string {
    return maskDigits(significantDigits(input));
}

/**
 * True when `next` is exactly `previous` with one NON-DIGIT character removed —
 * i.e. the user backspaced over mask punctuation ("(", ")", "-" or a space).
 *
 * A plain length comparison is not enough: pasting "89991234567" over a filled
 * field is also shorter than the formatted value, but it is not a deletion of a
 * mask character, and treating it as one silently dropped a digit.
 */
function removedMaskCharacter(previous: string, next: string): boolean {
    if (next.length !== previous.length - 1) {
        return false;
    }

    for (let i = 0; i < next.length; i += 1) {
        if (next[i] !== previous[i]) {
            // The removed character sits at `i`; everything after it must match.
            if (next.slice(i) !== previous.slice(i + 1)) {
                return false;
            }

            return !/\d/.test(previous[i] ?? '');
        }
    }

    return false;
}

export interface PhoneInputProps
    extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'inputMode'> {
    value: string;
    /** Receives the formatted value: "+7 (999) 123-45-67". */
    onChange: (value: string) => void;
    /**
     * Optional digits-only mirror ("79991234567") for forms that have to
     * validate or store raw digits. Wired only where a caller needs it.
     */
    onRawChange?: (raw: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    function PhoneInput({ value, onChange, onRawChange, onKeyDown, ...props }, ref) {
        const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
            const next = event.target.value;
            let rest = significantDigits(next);

            /*
             * Backspace across the mask. Deleting the ")" or a "-" leaves the
             * digits untouched, so re-masking would put the character straight
             * back and the caret would never move: the field looks stuck. When
             * the digits did not change but a mask character was removed, drop
             * a real digit instead.
             */
            if (rest === significantDigits(value) && removedMaskCharacter(value, next)) {
                rest = rest.slice(0, -1);
            }

            const formatted = maskDigits(rest);

            onChange(formatted);
            onRawChange?.(formatted.replace(/\D/g, ''));
        };

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
            onKeyDown?.(event);

            if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            // Single printable characters outside the mask are refused outright
            // so a letter never even flickers into the field.
            if (event.key.length === 1 && !/[0-9+()\-\s]/.test(event.key)) {
                event.preventDefault();
            }
        };

        return (
            <Input
                {...props}
                ref={ref}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
        );
    },
);

export default PhoneInput;
