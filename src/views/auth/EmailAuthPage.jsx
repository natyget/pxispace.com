'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import AuthField from '../../components/auth/AuthField';
import AuthPrints from '../../components/auth/AuthPrints';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { trackLogin, trackSignUp } from '../../lib/analytics';
import { defaultPostLoginPath } from '../../lib/dashboardPaths';
import {
    isValidUsername,
    sanitizeUsernameInput,
    PROFILE_USERNAME_MAX_LENGTH,
    USERNAME_RULES_HINT,
} from '../../utils/username';
// Must be written EXACTLY as `process.env.NEXT_PUBLIC_*`. Next inlines these by literal
// text substitution at build time; `globalThis.process?.env?.X` does not match the pattern,
// so it is never replaced and evaluates to undefined in the browser (globalThis.process
// does not exist there). That shipped a permanent "Apple Sign In is not configured" error
// no amount of rebuilding or Netlify env editing could fix. The optional chaining looked
// defensive but defeated the very mechanism it appeared to guard.
const APPLE_SERVICE_ID = (process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '').trim();
/** Must match a Return URL registered on the Apple Services ID (HTTPS in production). */
const APPLE_REDIRECT_URI = (
    process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI
    || process.env.NEXT_PUBLIC_SITE_URL
    || ''
).trim().replace(/\/$/, '');

function safeReturnPath(value) {
    if (!value || typeof value !== 'string') return null;
    // Paths only — reject open redirects and non-path tokens like from=mobile.
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    return value;
}

function appleErrorMessage(err) {
    if (!err) return 'Apple sign-in failed. Please try again.';
    const code = err.code || err.error || err.data?.code;
    const detail = err.data?.error || err.message;
    if (code === 'popup_closed_by_user' || err.error === 'popup_closed_by_user') return null;
    if (code === 'INVALID_APPLE_TOKEN') {
        return detail || 'Apple token was rejected. Check Service ID / audience configuration.';
    }
    if (code === 'APPLE_MISCONFIGURED' || code === 'APPLE_SDK_UNAVAILABLE') {
        return detail || 'Apple Sign In is not configured correctly.';
    }
    if (typeof detail === 'string' && detail && detail !== 'Apple sign-in failed. Please try again.') {
        return code ? `${detail} (${code})` : detail;
    }
    if (typeof code === 'string' && code !== 'popup_closed_by_user') {
        return `Apple sign-in failed (${code}). Please try again.`;
    }
    return 'Apple sign-in failed. Please try again.';
}

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

// The app's words, one message at a time.
function validateSignupPassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least 1 lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least 1 number';
    return null;
}

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
    const { user, saveAuth, isAuthenticated, authReady, updateUser, logout, phoneVerificationRequired } = useAuth();

    const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
    const showVerifiedMessage = searchParams.get('verified') === '1';
    // Prefer `redirect` (middleware contract). Fall back to path-shaped `from` for older links.
    // Do not treat from=mobile as a return path — that flag is for DashboardLayout chrome.
    const redirectPath = searchParams.get('redirect') || searchParams.get('next');
    const fromPath = searchParams.get('from');
    const safeRedirect = safeReturnPath(redirectPath) || safeReturnPath(fromPath);

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(searchParams.get('error') || '');
    const [usernameStatus, setUsernameStatus] = useState('idle');
    const [emailStatus, setEmailStatus] = useState('idle');
    // Validation messages, shown under the field they belong to, one at a time like the app.
    const [fieldErrors, setFieldErrors] = useState({});

    const debouncedUsername = useDebounce(username, 500);
    const debouncedEmail = useDebounce(email, 500);

    const handleAuthSuccess = useCallback(
        async ({ token, user: authUser }) => {
            await saveAuth({ token, user: authUser });
            if (safeRedirect) {
                router.replace(safeRedirect);
            } else if (authUser.accountTier === 'ADMIN') {
                router.replace('/dashboard/admin');
            } else if (phoneVerificationRequired && !authUser.phoneNumber) {
                router.replace('/verify-phone');
            } else {
                router.replace(defaultPostLoginPath(authUser));
            }
        },
        [saveAuth, router, safeRedirect, phoneVerificationRequired]
    );

    const hasRedirected = useRef(false);
    useEffect(() => {
        // Wait for AuthContext cookie re-sync so middleware accepts the session.
        if (!authReady || !isAuthenticated || !user?.id || hasRedirected.current) return;
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
    }, [authReady, isAuthenticated, user, user?.id, safeRedirect, router, updateUser, logout]);

    const loginWithGoogle = useGoogleLogin({
        flow: 'implicit',
        scope: '',
        prompt: 'select_account consent',
        onSuccess: async (tokenResponse) => {
            try {
                const result = await authService.googleTokenAuth(tokenResponse.access_token);
                if (result.isNewUser) trackSignUp('google');
                else trackLogin('google');
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

    const appleInitRef = useRef(false);
    const appleReadyRef = useRef(false);

    useEffect(() => {
        if (appleInitRef.current) return undefined;
        appleInitRef.current = true;

        if (!APPLE_SERVICE_ID) {
            console.warn('[Apple Sign In] NEXT_PUBLIC_APPLE_SERVICE_ID is not set');
            return undefined;
        }

        const redirectURI = APPLE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');
        if (!redirectURI || (typeof window !== 'undefined' && window.location.protocol === 'https:' && !redirectURI.startsWith('https://'))) {
            console.warn('[Apple Sign In] NEXT_PUBLIC_APPLE_REDIRECT_URI must be an HTTPS Return URL registered for the Services ID');
        }

        const initApple = () => {
            if (!window.AppleID?.auth || appleReadyRef.current) return;
            try {
                window.AppleID.auth.init({
                    clientId: APPLE_SERVICE_ID,
                    scope: 'name email',
                    redirectURI,
                    usePopup: true,
                });
                appleReadyRef.current = true;
            } catch (err) {
                console.error('[Apple Sign In] init failed', err);
                appleInitRef.current = false;
            }
        };

        if (window.AppleID?.auth) {
            initApple();
            return undefined;
        }

        const existing = document.querySelector('script[data-pxi-apple-auth]');
        if (existing) {
            existing.addEventListener('load', initApple);
            return () => existing.removeEventListener('load', initApple);
        }

        const script = document.createElement('script');
        script.src =
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.dataset.pxiAppleAuth = '1';
        script.onload = initApple;
        script.onerror = () => {
            appleInitRef.current = false;
            console.error('[Apple Sign In] failed to load Apple JS SDK');
        };
        document.head.appendChild(script);
        return undefined;
    }, []);

    const handleApple = async () => {
        try {
            if (!APPLE_SERVICE_ID) {
                const msg = 'Apple Sign In is not configured (missing NEXT_PUBLIC_APPLE_SERVICE_ID).';
                setError(msg);
                toast.error(msg);
                return;
            }
            if (!window.AppleID?.auth || !appleReadyRef.current) {
                const msg = 'Apple Sign In is still loading. Please try again in a moment.';
                setError(msg);
                toast.error(msg);
                return;
            }
            const response = await window.AppleID.auth.signIn();
            const identityToken = response.authorization.id_token;
            const fullName = response.user?.name
                ? { givenName: response.user.name.firstName, familyName: response.user.name.lastName }
                : undefined;
            const result = await authService.appleAuth(identityToken, fullName);
            if (result.isNewUser) trackSignUp('apple');
            else trackLogin('apple');
            handleAuthSuccess(result);
        } catch (err) {
            const msg = appleErrorMessage(err);
            if (!msg) return; // user closed popup
            setError(msg);
            toast.error(msg);
        }
    };

    // Email availability check (signup mode only)
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
        if (mode !== 'signup') { setEmailStatus('idle'); return; }
        const normalized = debouncedEmail.trim().toLowerCase();
        if (!normalized) { setEmailStatus('idle'); return; }
        if (!EMAIL_REGEX.test(normalized)) { setEmailStatus('invalid'); return; }
        setEmailStatus('checking');
        authService
            .checkEmail(normalized)
            .then((result) => { if (!cancelled) setEmailStatus(result); })
            .catch(() => { if (!cancelled) setEmailStatus('error'); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [debouncedEmail, mode]);

    // Username availability check (signup mode only)
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
        if (mode !== 'signup' || !debouncedUsername) { setUsernameStatus('idle'); return; }
        if (!isValidUsername(debouncedUsername)) { setUsernameStatus('invalid'); return; }
        setUsernameStatus('checking');
        authService
            .checkUsername(debouncedUsername)
            .then(({ available }) => { if (!cancelled) setUsernameStatus(available ? 'available' : 'taken'); })
            .catch(() => { if (!cancelled) setUsernameStatus('idle'); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
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
        setFieldErrors({});
        setShowPassword(false);
    };

    /** Typing in a field clears its message, and the one above the button. */
    const clearField = (field) => {
        setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setFieldErrors({});
        const normalizedEmail = email.trim().toLowerCase();
        const fail = (field, message) => setFieldErrors({ [field]: message });
        if (!email) return fail('email', 'Please enter your email');
        if (mode === 'signup' && !username) return fail('username', 'Please enter a username');
        if (!password) return fail('password', 'Please enter your password');
        if (mode === 'signup') {
            if (password !== confirmPassword) return fail('confirm', 'Passwords do not match');
            if (!EMAIL_REGEX.test(normalizedEmail)) return fail('email', 'Please enter a valid email address');
            const passwordError = validateSignupPassword(password);
            if (passwordError) return fail('password', passwordError);
            if (!isValidUsername(username)) return fail('username', USERNAME_RULES_HINT);
        }
        setLoading(true);
        try {
            if (mode === 'login') {
                const result = await authService.login(email, password);
                trackLogin('email');
                toast.success('Welcome back!');
                handleAuthSuccess(result);
            } else {
                const [emailCheck, usernameCheck] = await Promise.all([
                    authService.checkEmail(normalizedEmail),
                    authService.checkUsername(username).catch(() => null),
                ]);
                if (emailCheck === 'taken') {
                    setEmailStatus('taken');
                    return fail('email', 'An account with this email already exists. Try logging in instead.');
                }
                if (emailCheck === 'invalid') {
                    setEmailStatus('invalid');
                    return fail('email', 'Please enter a valid email address');
                }
                if (emailCheck !== 'available') {
                    setEmailStatus('error');
                    return fail('email', 'Could not verify email availability. Please check your connection and try again.');
                }
                if (usernameCheck && usernameCheck.available === false) {
                    setUsernameStatus('taken');
                    return fail('username', 'That username is taken. Please choose another.');
                }

                if (!phoneVerificationRequired) {
                    // Server isn't enforcing phone OTP right now (PHONE_VERIFICATION_ENABLED=0):
                    // create the account directly and land exactly where a login would.
                    const result = await authService.register(normalizedEmail, password, username);
                    trackSignUp('email');
                    toast.success('Welcome to PXI!');
                    handleAuthSuccess(result);
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
            if (err.code === 'EMAIL_EXISTS') {
                setFieldErrors({ email: 'An account with this email already exists. Try logging in instead.' });
                return;
            }
            if (err.code === 'USERNAME_EXISTS') {
                setUsernameStatus('taken');
                setFieldErrors({ username: 'That username is taken. Please choose another.' });
                return;
            }
            setError(
                err.code === 'NO_PASSWORD'
                    ? 'This account uses social login. Go back and use Google or Apple.'
                    : err.data?.error || err.message || 'Something went wrong. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === 'login';
    // A live "taken" reading shows under the field before submit, in the same place the submit message goes.
    const emailMessage = fieldErrors.email || (!isLogin && email && emailStatus === 'taken' ? 'An account with this email already exists. Try logging in instead.' : null);
    const usernameMessage = fieldErrors.username || (!isLogin && username && usernameStatus === 'taken' ? 'That username is taken. Please choose another.' : null);

    return (
        <div className="relative flex min-h-screen flex-1 flex-col bg-black">
            {/* Back button, the only top chrome on this page */}
            <button
                onClick={() => router.push('/')}
                className="absolute left-5 top-5 z-20 flex size-11 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:bg-white/10 hover:text-white md:left-8 md:top-8"
                aria-label="Back to home"
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={22} />
            </button>

            <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-10 pt-20 md:py-12">
                <div className="mx-auto flex w-full max-w-[420px] flex-col">
                    {showVerifiedMessage ? (
                        <p className="mb-4 text-center text-[15px] font-semibold text-white/70">
                            Please log in again to complete your profile.
                        </p>
                    ) : null}

                    <AuthPrints />

                    <h1 style={{ fontFamily: 'var(--font-heading)' }} className="mb-3.5 mt-2.5 text-center text-[32px] font-bold uppercase leading-[34px] tracking-[-0.4px] text-white">
                        {isLogin ? 'Welcome back' : 'Join PXI'}
                    </h1>

                    {/* LOG IN / SIGN UP: a dark track with a flat purple pill */}
                    <div role="tablist" aria-label="Log in or sign up" className="relative grid h-[52px] grid-cols-2 rounded-full bg-pxi-field p-[5px]">
                        <div
                            aria-hidden="true"
                            className="absolute inset-y-[5px] left-[5px] w-[calc(50%-5px)] rounded-full bg-pxi-purple transition-transform duration-300 ease-out motion-reduce:transition-none"
                            style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}
                        />
                        {[
                            ['login', 'LOG IN'],
                            ['signup', 'SIGN UP'],
                        ].map(([m, label]) => (
                            <button
                                key={m}
                                type="button"
                                role="tab"
                                aria-selected={mode === m}
                                onClick={() => switchMode(m)}
                                className={`relative z-[1] rounded-full text-[12.5px] font-extrabold tracking-[0.11em] text-white transition-opacity ${mode === m ? '' : 'opacity-60 hover:opacity-100'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4">
                        <SocialAuthButtons onApple={handleApple} onGoogle={() => loginWithGoogle()} disabled={loading} />
                    </div>

                    <div className="my-4 flex items-center gap-3.5" aria-hidden="true">
                        <div className="h-px flex-1 bg-white/[0.18]" />
                        <span className="text-[11px] font-extrabold tracking-[0.14em] text-[#8A8A8A]">OR</span>
                        <div className="h-px flex-1 bg-white/[0.18]" />
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
                        <AuthField
                            id="auth-email"
                            type="email"
                            name="email"
                            placeholder="Email address"
                            aria-label="Email address"
                            autoComplete="email"
                            autoCapitalize="none"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                clearField('email');
                            }}
                            disabled={loading}
                            error={emailMessage}
                        />

                        {!isLogin ? (
                            <AuthField
                                id="auth-username"
                                type="text"
                                name="username"
                                placeholder="Username"
                                aria-label="Username"
                                autoComplete="username"
                                autoCapitalize="none"
                                autoCorrect="off"
                                maxLength={PROFILE_USERNAME_MAX_LENGTH}
                                value={username}
                                onChange={(e) => {
                                    setUsername(sanitizeUsernameInput(e.target.value));
                                    clearField('username');
                                }}
                                disabled={loading}
                                error={usernameMessage}
                            />
                        ) : null}

                        <AuthField
                            id="auth-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            aria-label="Password"
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            autoCapitalize="none"
                            autoCorrect="off"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                clearField('password');
                            }}
                            disabled={loading}
                            error={fieldErrors.password}
                            right={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="flex h-14 w-12 items-center justify-center text-[#8A8A8A] hover:text-white"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={20} />
                                </button>
                            }
                        />

                        {!isLogin ? (
                            <AuthField
                                id="auth-confirm"
                                type={showPassword ? 'text' : 'password'}
                                name="confirm-password"
                                placeholder="Confirm password"
                                aria-label="Confirm password"
                                autoComplete="new-password"
                                autoCapitalize="none"
                                autoCorrect="off"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    clearField('confirm');
                                }}
                                disabled={loading}
                                error={fieldErrors.confirm}
                            />
                        ) : null}

                        {error ? (
                            <p role="alert" className="ml-1 text-[13px] font-semibold leading-[18px] text-[#FF5B5B]">
                                {error}
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            aria-label={loading ? (isLogin ? 'LOGGING IN…' : 'CREATING ACCOUNT…') : undefined}
                            className="mt-1 flex h-14 w-full items-center justify-center rounded-full bg-pxi-purple text-[13px] font-extrabold tracking-[0.15em] text-white transition-opacity active:opacity-80 disabled:opacity-60"
                        >
                            {loading ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <p className="mt-4 px-1 text-center text-xs leading-4 text-[#6E6E6E]">
                        {isLogin ? 'By signing in, you agree to our ' : 'By signing up, you agree to our '}
                        <Link href="/legal#terms" className="text-white underline">
                            Terms of Service (EULA)
                        </Link>
                        {', '}
                        <Link href="/legal#privacy" className="text-white underline">
                            Privacy Policy
                        </Link>
                        {', '}
                        <Link href="/legal#cookie" className="text-white underline">
                            Cookie Policy
                        </Link>
                        {', and '}
                        <Link href="/legal#community" className="text-white underline">
                            Community Standards
                        </Link>
                        . PXI has zero tolerance for objectionable content or abusive behavior.
                    </p>
                </div>
            </div>
        </div>
    );
}
