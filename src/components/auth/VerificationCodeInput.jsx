'use client';

import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';
import { cn } from '../../lib/utils';

const SEPARATOR_INDEX = 3;

/**
 * Six-digit OTP field (3 + separator + 3), styled like Untitled UI verification code inputs.
 * @see https://www.untitledui.com/react/components/verification-code-inputs
 */
export default function VerificationCodeInput({
    value = '',
    onChange,
    disabled = false,
    autoFocus = false,
    id = 'verification-code',
}) {
    return (
        <OTPInput
            id={id}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoFocus={autoFocus}
            inputMode="numeric"
            autoComplete="one-time-code"
            containerClassName="verification-code-input-group"
            pasteTransformer={(pasted) => pasted.replace(/\D/g, '').slice(0, 6)}
            render={({ slots }) => (
                <div className="verification-code-input" role="group" aria-label="Verification code">
                    {slots.map((slot, index) => (
                        <div key={index} className="verification-code-input__cell">
                            {index === SEPARATOR_INDEX ? (
                                <span className="verification-code-input__separator" aria-hidden>
                                    -
                                </span>
                            ) : null}
                            <div
                                className={cn(
                                    'verification-code-input__slot',
                                    slot.isActive && 'verification-code-input__slot--active',
                                    slot.char != null && 'verification-code-input__slot--filled',
                                    disabled && 'verification-code-input__slot--disabled',
                                )}
                            >
                                {slot.char != null ? (
                                    <span className="verification-code-input__char">{slot.char}</span>
                                ) : slot.hasFakeCaret ? (
                                    <span className="verification-code-input__caret" aria-hidden />
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        />
    );
}
