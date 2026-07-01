'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ViewIcon, ViewOffIcon, CheckmarkCircle02Icon, CancelCircleIcon, Loading02Icon } from '@hugeicons/core-free-icons';
import { FaApple, FaGoogle } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { defaultPostLoginPath } from '../../lib/dashboardPaths';
import {
    isValidUsername,
    sanitizeUsernameInput,
    PROFILE_USERNAME_MAX_LENGTH,
    USERNAME_RULES_HINT,
} from '../../utils/username';
const APPLE_SERVICE_ID = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '';

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function EmailAuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, saveAuth, isAuthenticated, updateUser, logout } = useAuth();

    const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
    const showVerifiedMessage = searchParams.get('verified') === '1';
    const redirectPath = searchParams.get('redirect');
    const safeRedirect = redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : null;

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(searchParams.get('error') || '');
    const [usernameStatus, setUsernameStatus] = useState('idle');
    const [emailStatus, setEmailStatus] = useState('idle');

    const debouncedUsername = useDebounce(username, 500);
    const debouncedEmail = useDebounce(email, 500);

    const handleAuthSuccess = useCallback(
        async ({ token, user: authUser }) => {
            await saveAuth({ token, user: authUser });
            if (safeRedirect) {
                router.replace(safeRedirect);
            } else if (authUser.accountTier === 'ADMIN') {
                router.replace('/dashboard/admin');
            } else if (!authUser.phoneNumber) {
                router.replace('/verify-phone');
            } else {
                router.replace(defaultPostLoginPath(authUser));
            }
        },
        [saveAuth, router, safeRedirect]
    );

    const hasRedirected = useRef(false);
    useEffect(() => {
        if (!isAuthenticated || !user?.id || hasRedirected.current) return;
        hasRedirected.current = true;
        authService.getMe(user.id)
            .then(({ user: fresh }) => {
                updateUser(fresh);
                const dest = safeRedirect || defaultPostLoginPath(fresh);
                setTimeout(() => router.replace(dest), 0);
            })
            .catch(async (error) => {
                if (shouldClearAuth(error)) {
                    await logout();
                    hasRedirected.current = false;
                    return;
                }
                router.replace(safeRedirect || defaultPostLoginPath(user));
            });
    }, [isAuthenticated, user?.id, safeRedirect, router, updateUser, logout]);

    const loginWithGoogle = useGoogleLogin({
        flow: 'implicit',
        scope: '',
        prompt: 'select_account consent',
        onSuccess: async (tokenResponse) => {
            try {
                const result = await authService.googleTokenAuth(tokenResponse.access_token);
                handleAuthSuccess(result);
            } catch {
                setError('Google sign-in failed. Please try again.');
                toast.error('Google sign-in failed. Please try again.');
            }
        },
        onError: () => {
            setError('Google sign-in failed. Please try again.');
            toast.error('Google sign-in failed. Please try again.');
        },
    });

    useEffect(() => {
        const script = document.createElement('script');
        script.src =
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.onload = () => {
            window.AppleID?.auth.init({
                clientId: APPLE_SERVICE_ID,
                scope: 'name email',
                redirectURI: window.location.origin,
                usePopup: true,
            });
        };
        document.head.appendChild(script);
    }, []);

    const handleApple = async () => {
        try {
            const response = await window.AppleID.auth.signIn();
            const identityToken = response.authorization.id_token;
            const fullName = response.user?.name
                ? { givenName: response.user.name.firstName, familyName: response.user.name.lastName }
                : undefined;
            const result = await authService.appleAuth(identityToken, fullName);
            handleAuthSuccess(result);
        } catch (err) {
            if (err?.error !== 'popup_closed_by_user') {
                setError('Apple sign-in failed. Please try again.');
                toast.error('Apple sign-in failed. Please try again.');
            }
        }
    };

    // Email availability check (signup mode only)
    useEffect(() => {
        if (mode !== 'signup') { setEmailStatus('idle'); return; }
        const normalized = debouncedEmail.trim().toLowerCase();
        if (!normalized) { setEmailStatus('idle'); return; }
        if (!EMAIL_REGEX.test(normalized)) { setEmailStatus('invalid'); return; }
        setEmailStatus('checking');
        authService
            .checkEmail(normalized)
            .then((result) => setEmailStatus(result))
            .catch(() => setEmailStatus('error'));
    }, [debouncedEmail, mode]);

    // Username availability check (signup mode only)
    useEffect(() => {
        if (mode !== 'signup' || !debouncedUsername) { setUsernameStatus('idle'); return; }
        if (!isValidUsername(debouncedUsername)) { setUsernameStatus('invalid'); return; }
        setUsernameStatus('checking');
        authService
            .checkUsername(debouncedUsername)
            .then(({ available }) => setUsernameStatus(available ? 'available' : 'taken'))
            .catch(() => setUsernameStatus('idle'));
    }, [debouncedUsername, mode]);

    // Reset fields when mode changes
    const switchMode = (next) => {
        setMode(next);
        setError('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setUsernameStatus('idle');
        setEmailStatus('idle');
    };

    const passwordRules = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
    const passwordValid = passwordRules.every((r) => r.passed);
    const passwordsMatch = password === confirmPassword && confirmPassword !== '';

    const canSubmit = mode === 'login'
        ? email && password && !loading
        : email &&
          EMAIL_REGEX.test(email.trim().toLowerCase()) &&
          emailStatus === 'available' &&
          isValidUsername(username) &&
          usernameStatus === 'available' &&
          passwordValid &&
          passwordsMatch &&
          !loading;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                const result = await authService.login(email, password);
                toast.success('Welcome back!');
                handleAuthSuccess(result);
            } else {
                const normalizedEmail = email.trim().toLowerCase();
                const emailCheck = await authService.checkEmail(normalizedEmail);
                if (emailCheck === 'taken') {
                    setEmailStatus('taken');
                    const msg = 'An account with this email already exists. Try logging in instead.';
                    setError(msg);
                    toast.error(msg);
                    return;
                }
                if (emailCheck === 'invalid') {
                    setEmailStatus('invalid');
                    const msg = 'Please enter a valid email address.';
                    setError(msg);
                    toast.error(msg);
                    return;
                }
                if (emailCheck !== 'available') {
                    setEmailStatus('error');
                    const msg = 'Could not verify email availability. Please check your connection and try again.';
                    setError(msg);
                    toast.error(msg);
                    return;
                }

                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(
                        'pxi_pending_signup',
                        JSON.stringify({ email: normalizedEmail, username, password }),
                    );
                    if (safeRedirect) {
                        sessionStorage.setItem('pxi_after_register_login_redirect', safeRedirect);
                    }
                }
                toast.success('Almost there! Verify your phone to finish signing up.');
                router.replace('/verify-phone');
            }
        } catch (err) {
            let msg;
            if (err.code === 'NO_PASSWORD') {
                msg = 'This account uses social login. Go back and use Google or Apple.';
            } else if (err.code === 'EMAIL_EXISTS') {
                msg = 'An account with this email already exists.';
            } else if (err.code === 'USERNAME_EXISTS') {
                msg = 'That username is already taken.';
                setUsernameStatus('taken');
            } else {
                msg = err.data?.error || err.message || 'Something went wrong. Please try again.';
            }
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === 'login';

    return (
        <div className="flex flex-1 flex-col min-h-0 bg-black relative overflow-hidden">
            {showVerifiedMessage && (
                <div
                    className="relative z-20 mx-4 mt-6 rounded-xl px-4 py-3 text-center text-sm font-semibold"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(216,74,255,0.95)',
                    }}
                >
                    Please log in again to complete your profile.
                </div>
            )}

            {/* Back button */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-20 left-5 z-20 flex items-center justify-center md:top-24"
                style={{
                    padding: 10,
                    color: 'rgba(255,255,255,0.6)',
                    borderRadius: 9999,
                    background: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={28} />
            </button>

            {/* Scrollable content */}
            <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center px-0 md:px-4">
                <div className="w-full max-w-[400px] px-4 pt-[5.5rem] pb-12 flex flex-col md:px-0 md:pt-[5.5rem]">

                    {/* Header */}
                    <div className="mb-5 flex justify-center">
                        <img
                            src="/favicon.png"
                            alt="PXI"
                            width={200}
                            height={120}
                            className="h-[120px] w-[200px] object-contain"
                        />
                    </div>

                    {/* Auth card — panel chrome on md+ only (mobile matches app: no card wrapper) */}
                    <div
                        className="flex flex-col p-0 md:rounded-2xl md:border md:border-white/12 md:bg-white/[0.03] md:p-6 md:shadow-[0_0_40px_rgba(216,74,255,0.08)]"
                    >
                    {/* Mode toggle */}
                    <div className="flex mb-6 border-b border-white/10">
                        {['login', 'signup'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => switchMode(m)}
                                className="flex-1 font-black uppercase transition-colors"
                                style={{
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    fontSize: 12,
                                    letterSpacing: '0.15em',
                                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                                    borderBottom: mode === m ? '2px solid var(--color-pxi-purple)' : '2px solid transparent',
                                    marginBottom: -1,
                                }}
                            >
                                {m === 'login' ? 'LOG IN' : 'SIGN UP'}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="mb-6 px-4 py-3 text-sm"
                            style={{
                                background: 'rgba(255,50,50,0.08)',
                                border: '1px solid rgba(255,50,50,0.2)',
                                borderRadius: 14,
                                color: '#ff6b6b',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 0 }}>

                        {/* Email */}
                        <AuthField>
                            <div className="relative">
                                <AuthInput
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="EMAIL ADDRESS"
                                    required
                                    style={!isLogin ? { paddingRight: 48 } : undefined}
                                />
                                {!isLogin && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        {emailStatus === 'checking' && <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                                        {emailStatus === 'available' && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} style={{ color: '#4ade80' }} />}
                                        {(emailStatus === 'taken' || emailStatus === 'invalid' || emailStatus === 'error') && (
                                            <HugeiconsIcon icon={CancelCircleIcon} size={14} style={{ color: '#f87171' }} />
                                        )}
                                    </div>
                                )}
                            </div>
                            {!isLogin && email && emailStatus === 'taken' && (
                                <FieldHint color="#f87171">This email is already used. Try logging in instead.</FieldHint>
                            )}
                            {!isLogin && email && emailStatus === 'available' && (
                                <FieldHint color="#4ade80">Email is available</FieldHint>
                            )}
                            {!isLogin && email && emailStatus === 'invalid' && (
                                <FieldHint color="rgba(255,255,255,0.3)">Please enter a valid email address</FieldHint>
                            )}
                            {!isLogin && email && emailStatus === 'error' && (
                                <FieldHint color="#f87171">Could not verify email availability</FieldHint>
                            )}
                        </AuthField>

                        {/* Username (signup only) */}
                        {!isLogin && (
                            <AuthField>
                                <div className="relative">
                                    <AuthInput
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(sanitizeUsernameInput(e.target.value))
                                        }
                                        placeholder="USERNAME"
                                        maxLength={PROFILE_USERNAME_MAX_LENGTH}
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        {usernameStatus === 'checking' && <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                                        {usernameStatus === 'available' && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} style={{ color: '#4ade80' }} />}
                                        {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <HugeiconsIcon icon={CancelCircleIcon} size={14} style={{ color: '#f87171' }} />}
                                    </div>
                                </div>
                                {username && usernameStatus === 'taken' && <FieldHint color="#f87171">@{username} is already taken</FieldHint>}
                                {username && usernameStatus === 'available' && <FieldHint color="#4ade80">@{username} is available</FieldHint>}
                                {username && usernameStatus === 'invalid' && <FieldHint color="rgba(255,255,255,0.3)">{USERNAME_RULES_HINT}</FieldHint>}
                            </AuthField>
                        )}

                        {/* Password */}
                        <AuthField>
                            <div className="relative">
                                <AuthInput
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="PASSWORD"
                                    required
                                    style={{ paddingRight: 48 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2"
                                    style={{ color: 'rgba(255,255,255,0.35)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                                >
                                    {showPassword ? <HugeiconsIcon icon={ViewOffIcon} size={16} /> : <HugeiconsIcon icon={ViewIcon} size={16} />}
                                </button>
                            </div>
                            {/* Password rules — signup only */}
                            {!isLogin && password.length > 0 && (
                                <div className="grid grid-cols-2 mt-3" style={{ gap: '6px 12px' }}>
                                    {passwordRules.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center gap-1.5"
                                            style={{
                                                fontSize: 10,
                                                letterSpacing: '0.05em',
                                                color: r.passed ? '#4ade80' : 'rgba(255,255,255,0.25)',
                                            }}
                                        >
                                            {r.passed ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} /> : <HugeiconsIcon icon={CancelCircleIcon} size={11} />}
                                            {r.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AuthField>

                        {/* Confirm password — signup only */}
                        {!isLogin && (
                            <AuthField>
                                <AuthInput
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="CONFIRM PASSWORD"
                                    required
                                    focusColor={
                                        confirmPassword
                                            ? passwordsMatch
                                                ? 'rgba(74,222,128,0.5)'
                                                : 'rgba(248,113,113,0.5)'
                                            : undefined
                                    }
                                />
                                {confirmPassword && !passwordsMatch && (
                                    <FieldHint color="#f87171">Passwords do not match</FieldHint>
                                )}
                            </AuthField>
                        )}

                        {/* Submit button */}
                        <div className="relative mt-2 mb-2">
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className={`relative z-[2] h-14 w-full rounded-full border border-white/15 font-black uppercase text-[13px] tracking-[0.15em] transition-all ${
                                    canSubmit
                                        ? 'cursor-pointer bg-pxi-purple text-white shadow-[0_0_20px_rgba(216,74,255,0.4)] hover:brightness-110'
                                        : 'cursor-not-allowed bg-pxi-purple/30 text-white/30'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                                        {isLogin ? 'LOGGING IN…' : 'CREATING ACCOUNT…'}
                                    </span>
                                ) : isLogin ? (
                                    'LOG IN'
                                ) : (
                                    'CREATE ACCOUNT'
                                )}
                            </button>

                            {/* Glow strip below button — matches mobile effect */}
                            {canSubmit && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: -4,
                                        left: '10%',
                                        right: '10%',
                                        height: 10,
                                        background: '#B026FF',
                                        opacity: 0.35,
                                        filter: 'blur(8px)',
                                        borderRadius: 8,
                                        zIndex: 1,
                                    }}
                                />
                            )}
                        </div>

                        <p
                            className="text-center"
                            style={{
                                marginTop: 4,
                                marginBottom: 8,
                                color: 'rgba(255,255,255,0.35)',
                                fontSize: 11,
                                letterSpacing: '0.02em',
                                lineHeight: 1.55,
                            }}
                        >
                            {isLogin ? 'By signing in, you agree to our ' : 'By signing up, you agree to our '}
                            <Link href="/legal#terms" className="text-pxi-purple underline">
                                Terms of Service
                            </Link>
                            {', '}
                            <Link href="/legal#privacy" className="text-pxi-purple underline">
                                Privacy Policy
                            </Link>
                            {', and '}
                            <Link href="/legal#cookie" className="text-pxi-purple underline">
                                Cookie Policy
                            </Link>
                            .
                        </p>
                    </form>

                    {/* Social login */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-px bg-white/15" />
                        <p
                            className="shrink-0 font-bold uppercase"
                            style={{
                                fontSize: 10,
                                letterSpacing: '0.2em',
                                color: 'rgba(255,255,255,0.35)',
                            }}
                        >
                            OR CONTINUE WITH
                        </p>
                        <div className="flex-1 h-px bg-white/15" />
                    </div>
                    <div className="flex gap-[12px] mt-3">
                        <FooterPill
                            onClick={() => loginWithGoogle()}
                            icon={<FaGoogle size={14} className="text-white/50" />}
                        >
                            GOOGLE
                        </FooterPill>
                        <FooterPill
                            onClick={handleApple}
                            icon={<FaApple size={14} className="text-white/50" />}
                        >
                            APPLE
                        </FooterPill>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Matches mobile `GlassInput` + auth pill radius (56px tall, 24px horizontal padding). */
const AUTH_INPUT_HEIGHT_PX = 56;
const AUTH_INPUT_PADDING_X_PX = 24;

function AuthField({ children }) {
    return <div className="auth-field-gap">{children}</div>;
}

function AuthInput({ focusColor, style = {}, ...props }) {
    const [focused, setFocused] = useState(false);
    const defaultFocus = 'rgba(168,85,247,0.5)';
    const activeFocus = focusColor || defaultFocus;

    return (
        <input
            {...props}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="auth-glass-input w-full text-sm font-semibold text-white outline-none transition-all placeholder:text-sm placeholder:font-semibold placeholder:text-white/30 placeholder:uppercase placeholder:tracking-[0.5px]"
            style={{
                height: AUTH_INPUT_HEIGHT_PX,
                borderRadius: 9999,
                background: focused ? '#252525' : '#1c1c1c',
                border: `1px solid ${focused ? activeFocus : 'rgba(255,255,255,0.05)'}`,
                boxShadow: focused
                    ? '0 0 10px rgba(168, 85, 247, 0.2)'
                    : 'none',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.5px',
                paddingLeft: AUTH_INPUT_PADDING_X_PX,
                paddingRight: AUTH_INPUT_PADDING_X_PX,
                color: '#fff',
                ...style,
            }}
        />
    );
}

function FieldHint({ color, children }) {
    return (
        <p
            className="font-bold"
            style={{
                fontSize: 10,
                letterSpacing: '0.05em',
                color,
                marginTop: 6,
                paddingLeft: 4,
            }}
        >
            {children}
        </p>
    );
}

function FooterPill({ onClick, icon, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="auth-social-pill flex-1 min-h-12 rounded-full border-0 bg-white/[0.06] px-4 py-3 text-[10px] font-bold uppercase tracking-[2px] text-white/[0.55] transition-all hover:text-white/70 active:bg-white/10"
        >
            <span className="flex items-center justify-center gap-2">
                {icon}
                {children}
            </span>
        </button>
    );
}
