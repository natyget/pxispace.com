'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Loading02Icon } from '@hugeicons/core-free-icons';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import VerificationCodeInput from '../../components/auth/VerificationCodeInput';
import { defaultPostLoginPath } from '../../lib/dashboardPaths';
import { toast } from 'sonner';

const PENDING_SIGNUP_KEY = 'pxi_pending_signup';
const RESEND_COOLDOWN_SEC = 60;

function pillButtonClass(enabled) {
    return `relative z-[2] h-14 w-full rounded-full border-0 font-black uppercase text-[13px] tracking-[0.15em] transition-all ${
        enabled
            ? 'cursor-pointer bg-pxi-purple text-white shadow-[0_0_20px_rgba(216,74,255,0.4)] hover:brightness-110'
            : 'cursor-not-allowed bg-pxi-purple/30 text-white/30'
    }`;
}

export default function VerifyPhonePage() {
    const router = useRouter();
    const { user, saveAuth } = useAuth();
    const [pendingSignup, setPendingSignup] = useState(null);
    const [phoneValue, setPhoneValue] = useState('');
    const [step, setStep] = useState('phone');
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');

    const fullPhone = phoneValue || '';
    const phoneDigits = (phoneValue || '').replace(/\D/g, '');
    const phoneValid = phoneDigits.length >= 10;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
        if (raw) {
            try {
                setPendingSignup(JSON.parse(raw));
            } catch {
                setPendingSignup(null);
            }
        }
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const startResendCooldown = () => setResendCooldown(RESEND_COOLDOWN_SEC);

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!phoneValid) {
            setError('Enter at least 10 digits');
            return;
        }
        setError('');
        setIsSendingCode(true);
        try {
            await authService.sendVerification(fullPhone);
            setStep('code');
            setCode('');
            startResendCooldown();
        } catch (err) {
            setError(err.data?.error || err.message || 'Could not send code');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleResendCode = async () => {
        if (!phoneValid || isSendingCode || isVerifying || resendCooldown > 0) return;
        setError('');
        setResendSuccess('');
        setIsSendingCode(true);
        try {
            await authService.sendVerification(fullPhone);
            setCode('');
            startResendCooldown();
            const message = 'A new verification code was sent to your phone.';
            setResendSuccess(message);
            toast.success(message);
        } catch (err) {
            setError(err.data?.error || err.message || 'Could not resend code');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const trimmedCode = code.trim().replace(/\s/g, '');
        if (trimmedCode.length < 6) {
            setError('Enter the 6-digit code');
            return;
        }
        setError('');
        setResendSuccess('');
        setIsVerifying(true);
        try {
            if (pendingSignup) {
                const [emailCheck, usernameCheck] = await Promise.all([
                    authService.checkEmail(pendingSignup.email),
                    authService.checkUsername(pendingSignup.username),
                ]);

                if (emailCheck === 'taken') {
                    sessionStorage.removeItem(PENDING_SIGNUP_KEY);
                    setError('An account with this email already exists. Try logging in instead.');
                    router.replace('/login');
                    return;
                }
                if (usernameCheck?.available === false) {
                    sessionStorage.removeItem(PENDING_SIGNUP_KEY);
                    setError('That username is already taken. Please sign up again.');
                    router.replace('/login');
                    return;
                }
                if (emailCheck !== 'available' || usernameCheck?.available !== true) {
                    setError('Could not verify your sign-up details. Please check your connection and try again.');
                    return;
                }

                await authService.verifyOtp(fullPhone, trimmedCode);
                const registerResult = await authService.register(
                    pendingSignup.email,
                    pendingSignup.password,
                    pendingSignup.username,
                    fullPhone
                );
                sessionStorage.removeItem(PENDING_SIGNUP_KEY);
                const { token, user: newUser } = registerResult;
                await saveAuth({ token, user: newUser });

                const postCheckout =
                    typeof window !== 'undefined'
                        ? sessionStorage.getItem('pxi_after_register_login_redirect')
                        : null;
                if (postCheckout && typeof window !== 'undefined') {
                    sessionStorage.removeItem('pxi_after_register_login_redirect');
                }

                if (postCheckout) {
                    router.replace(postCheckout);
                } else {
                    router.replace(defaultPostLoginPath(newUser));
                }
            } else if (user) {
                const result = await authService.verifyPhone(fullPhone, trimmedCode);
                saveAuth({ token: result.token, user: result.user });
                router.replace(defaultPostLoginPath(result.user));
            } else {
                setError('Session expired. Please sign in again.');
                router.replace('/login');
            }
        } catch (err) {
            if (err.code === 'EMAIL_EXISTS') {
                sessionStorage.removeItem(PENDING_SIGNUP_KEY);
                setError('An account with this email already exists. Try logging in instead.');
                router.replace('/login');
                return;
            }
            if (err.code === 'USERNAME_EXISTS') {
                sessionStorage.removeItem(PENDING_SIGNUP_KEY);
                setError('That username is already taken. Please sign up again.');
                router.replace('/login');
                return;
            }
            setError(err.data?.error || err.message || 'Invalid or expired code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBack = () => {
        if (step === 'code') {
            setStep('phone');
            setCode('');
            setResendCooldown(0);
            setError('');
        } else if (pendingSignup) {
            router.replace('/login');
        } else {
            router.replace('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.13),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(216,74,255,0.18),transparent_26%),linear-gradient(180deg,#070707,#000)]" />
            </div>
            <button
                type="button"
                onClick={handleBack}
                className="absolute top-5 left-5 z-20 flex items-center justify-center"
                style={{ padding: 10, color: 'rgba(255,255,255,0.6)', borderRadius: 9999, background: 'transparent' }}
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={28} />
            </button>

            <div className="relative z-10 flex-1 overflow-y-auto flex flex-col">
                <div className="w-full max-w-sm mx-auto px-7 pt-24 pb-12 flex flex-col flex-1">
                    <div className="mb-8">
                        <h1
                            className="font-black uppercase text-white"
                            style={{ fontSize: 22, letterSpacing: '0.12em', marginBottom: 8 }}
                        >
                            PHONE VERIFICATION
                        </h1>
                        <p className="text-sm text-white/60" style={{ letterSpacing: '0.03em' }}>
                            {step === 'phone'
                                ? 'Enter your phone number. We’ll send you a code.'
                                : `Enter the 6-digit code sent to ${fullPhone}`}
                        </p>
                    </div>

                    {error && (
                        <div
                            className="mb-6 px-4 py-3 text-sm rounded-xl"
                            style={{
                                background: 'rgba(255,50,50,0.08)',
                                border: '1px solid rgba(255,50,50,0.2)',
                                color: '#ff6b6b',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {resendSuccess && !error && (
                        <div
                            className="mb-6 px-4 py-3 text-sm rounded-xl"
                            style={{
                                background: 'rgba(34,197,94,0.1)',
                                border: '1px solid rgba(34,197,94,0.25)',
                                color: '#4ade80',
                            }}
                        >
                            {resendSuccess}
                        </div>
                    )}

                    {step === 'phone' && (
                        <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                            <div className="verify-phone-input-wrapper">
                                <PhoneInput
                                    international
                                    defaultCountry="US"
                                    placeholder="Enter phone number"
                                    value={phoneValue}
                                    onChange={setPhoneValue}
                                    disabled={isSendingCode}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!phoneValid || isSendingCode}
                                className={pillButtonClass(phoneValid && !isSendingCode)}
                            >
                                {isSendingCode ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                                        SENDING...
                                    </span>
                                ) : (
                                    'SEND CODE'
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'code' && (
                        <form onSubmit={handleVerify} className="flex flex-col gap-4">
                            <div>
                                <p
                                    className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/50 mb-2.5 ml-1"
                                >
                                    Verification code
                                </p>
                                <VerificationCodeInput
                                    value={code}
                                    onChange={setCode}
                                    disabled={isVerifying}
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col gap-8 mt-3">
                                <button
                                    type="submit"
                                    disabled={code.trim().replace(/\s/g, '').length < 6 || isVerifying}
                                    className={pillButtonClass(
                                        code.trim().replace(/\s/g, '').length >= 6 && !isVerifying,
                                    )}
                                >
                                    {isVerifying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                                            VERIFYING...
                                        </span>
                                    ) : (
                                        'VERIFY'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleResendCode()}
                                    disabled={isSendingCode || isVerifying || resendCooldown > 0}
                                    className="text-sm font-bold disabled:opacity-40"
                                    style={{ color: 'var(--color-pxi-purple)' }}
                                >
                                    {isSendingCode
                                        ? 'Sending...'
                                        : resendCooldown > 0
                                          ? `Resend code in ${resendCooldown}s`
                                          : 'Resend code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setCode(''); setResendCooldown(0); setError(''); setResendSuccess(''); }}
                                    className="text-sm text-white/50 font-semibold"
                                >
                                    ← Use a different number
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
