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

const PENDING_SIGNUP_KEY = 'pxi_pending_signup';

export default function VerifyPhonePage() {
    const router = useRouter();
    const { user, saveAuth } = useAuth();
    const [pendingSignup, setPendingSignup] = useState(null);
    const [phoneValue, setPhoneValue] = useState('');
    const [step, setStep] = useState('phone');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!phoneValid) {
            setError('Enter at least 10 digits');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await authService.sendVerification(fullPhone);
            setStep('code');
        } catch (err) {
            setError(err.data?.error || err.message || 'Could not send code');
        } finally {
            setLoading(false);
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
        setLoading(true);
        try {
            if (pendingSignup) {
                await authService.verifyOtp(fullPhone, trimmedCode);
                // Register returns token + user — keep session (no relogin), same as mobile signup flow.
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
                // Backend saves phoneNumber to profile only when OTP verification succeeds
                const result = await authService.verifyPhone(fullPhone, trimmedCode);
                saveAuth({ token: result.token, user: result.user });
                router.replace(defaultPostLoginPath(result.user));
            } else {
                setError('Session expired. Please sign in again.');
                router.replace('/login');
            }
        } catch (err) {
            setError(err.data?.error || err.message || 'Invalid or expired code');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'code') {
            setStep('phone');
            setCode('');
            setError('');
        } else if (pendingSignup) {
            router.replace('/login');
        } else {
            router.replace('/login');
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
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

                    {step === 'phone' && (
                        <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                            <div className="verify-phone-input-wrapper">
                                <PhoneInput
                                    international
                                    defaultCountry="US"
                                    placeholder="Enter phone number"
                                    value={phoneValue}
                                    onChange={setPhoneValue}
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!phoneValid || loading}
                                className="w-full h-14 rounded-2xl font-black uppercase text-white disabled:opacity-50 transition-opacity"
                                style={{
                                    background: phoneValid && !loading
                                        ? 'linear-gradient(90deg, #B026FF 0%, #7A00CC 100%)'
                                        : 'linear-gradient(90deg, rgba(176,38,255,0.3) 0%, rgba(122,0,204,0.3) 100%)',
                                    letterSpacing: '0.12em',
                                }}
                            >
                                {loading ? <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin inline" /> : 'SEND CODE'}
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
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={code.trim().replace(/\s/g, '').length < 6 || loading}
                                className="w-full h-14 rounded-2xl font-black uppercase text-white disabled:opacity-50"
                                style={{
                                    background: (code.trim().replace(/\s/g, '').length >= 6 && !loading)
                                        ? 'linear-gradient(90deg, #B026FF 0%, #7A00CC 100%)'
                                        : 'linear-gradient(90deg, rgba(176,38,255,0.3) 0%, rgba(122,0,204,0.3) 100%)',
                                    letterSpacing: '0.12em',
                                }}
                            >
                                {loading ? <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin inline" /> : 'VERIFY'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                                className="text-sm text-white/50 font-semibold"
                            >
                                ← Use a different number
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
