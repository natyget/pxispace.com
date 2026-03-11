import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { FaApple } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import LogoSVG from '../../assets/logo.svg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const APPLE_SERVICE_ID = import.meta.env.VITE_APPLE_SERVICE_ID;

const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
];

const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function SignupPage() {
    const navigate = useNavigate();
    const { saveAuth } = useAuth();

    const [email, setEmail] = useState('');
    const [handle, setHandle] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [handleStatus, setHandleStatus] = useState('idle'); // idle | checking | available | taken | invalid
    const googleBtnRef = useRef(null);
    const debouncedHandle = useDebounce(handle, 500);

    const handleAuthSuccess = useCallback(
        ({ token, user }) => {
            saveAuth({ token, user });
            // New social signups are PARTIAL — send to passport-required
            navigate('/passport-required', { replace: true });
        },
        [saveAuth, navigate]
    );

    // Handle availability check
    useEffect(() => {
        if (!debouncedHandle) { setHandleStatus('idle'); return; }
        if (!HANDLE_REGEX.test(debouncedHandle)) { setHandleStatus('invalid'); return; }
        setHandleStatus('checking');
        authService
            .checkHandle(debouncedHandle)
            .then(({ available }) => setHandleStatus(available ? 'available' : 'taken'))
            .catch(() => setHandleStatus('idle'));
    }, [debouncedHandle]);

    // Load Google GSI
    useEffect(() => {
        const initGoogle = () => {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    setError('');
                    try {
                        const result = await authService.googleAuth(response.credential);
                        handleAuthSuccess(result);
                    } catch (err) {
                        setError(err.message || 'Google sign-up failed. Please try again.');
                    }
                },
            });
            if (googleBtnRef.current) {
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'filled_black',
                    size: 'large',
                    width: googleBtnRef.current.offsetWidth || 320,
                    shape: 'rectangular',
                    text: 'signup_with',
                });
            }
        };

        if (window.google?.accounts?.id) { initGoogle(); return; }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, [handleAuthSuccess]);

    // Load Apple Sign-In JS
    useEffect(() => {
        const script = document.createElement('script');
        script.src =
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.onload = () => {
            window.AppleID.auth.init({
                clientId: APPLE_SERVICE_ID,
                scope: 'name email',
                redirectURI: window.location.origin,
                usePopup: true,
            });
        };
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, []);

    const handleAppleSignUp = async () => {
        setError('');
        try {
            const response = await window.AppleID.auth.signIn();
            const identityToken = response.authorization.id_token;
            const fullName =
                response.user?.name
                    ? { givenName: response.user.name.firstName, familyName: response.user.name.lastName }
                    : undefined;
            const result = await authService.appleAuth(identityToken, fullName);
            handleAuthSuccess(result);
        } catch (err) {
            if (err?.error !== 'popup_closed_by_user') {
                setError('Apple sign-up failed. Please try again.');
            }
        }
    };

    const passwordRules = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
    const passwordValid = passwordRules.every((r) => r.passed);
    const passwordsMatch = password === confirmPassword && confirmPassword !== '';

    const canSubmit =
        email &&
        HANDLE_REGEX.test(handle) &&
        handleStatus === 'available' &&
        passwordValid &&
        passwordsMatch &&
        !loading;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        setLoading(true);
        try {
            const result = await authService.register(email, password, handle);
            saveAuth(result);
            navigate('/passport-required', { replace: true });
        } catch (err) {
            if (err.code === 'EMAIL_EXISTS') {
                setError('An account with this email already exists. Try signing in.');
            } else if (err.code === 'HANDLE_EXISTS') {
                setError('That handle is already taken. Please choose another.');
                setHandleStatus('taken');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-16">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pxi-purple/8 rounded-full blur-[140px]" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <Link to="/">
                        <img src={LogoSVG} alt="PXI" className="h-10 w-10 mb-5" />
                    </Link>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Create an account
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Your PXI identity starts here
                    </p>
                </div>

                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-7 backdrop-blur-md">
                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Social Sign-Up */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-center">
                            <div
                                ref={googleBtnRef}
                                className="w-full overflow-hidden rounded-xl"
                            />
                        </div>
                        <button
                            onClick={handleAppleSignUp}
                            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-all"
                        >
                            <FaApple size={18} />
                            Sign up with Apple
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-white/8" />
                        <span className="text-zinc-600 text-xs uppercase tracking-widest">
                            or sign up with email
                        </span>
                        <div className="flex-1 h-px bg-white/8" />
                    </div>

                    {/* Email / Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-pxi-purple/50 focus:ring-1 focus:ring-pxi-purple/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Handle
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm select-none">
                                    @
                                </span>
                                <input
                                    type="text"
                                    value={handle}
                                    onChange={(e) =>
                                        setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))
                                    }
                                    placeholder="yourhandle"
                                    maxLength={20}
                                    className="w-full bg-zinc-800/60 border border-white/8 rounded-xl pl-8 pr-10 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-pxi-purple/50 focus:ring-1 focus:ring-pxi-purple/20 transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <HandleStatusIcon status={handleStatus} />
                                </div>
                            </div>
                            <HandleStatusMessage status={handleStatus} handle={handle} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-4 pr-10 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-pxi-purple/50 focus:ring-1 focus:ring-pxi-purple/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="mt-2.5 grid grid-cols-2 gap-1">
                                    {passwordRules.map((r) => (
                                        <div
                                            key={r.id}
                                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                                                r.passed ? 'text-green-400' : 'text-zinc-600'
                                            }`}
                                        >
                                            {r.passed ? (
                                                <CheckCircle2 size={11} />
                                            ) : (
                                                <XCircle size={11} />
                                            )}
                                            {r.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full bg-zinc-800/60 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                                    confirmPassword && !passwordsMatch
                                        ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20'
                                        : confirmPassword && passwordsMatch
                                        ? 'border-green-500/40 focus:border-green-500/60 focus:ring-green-500/20'
                                        : 'border-white/8 focus:border-pxi-purple/50 focus:ring-pxi-purple/20'
                                }`}
                            />
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-red-400 text-xs mt-1.5">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full py-3 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:shadow-[0_0_36px_rgba(216,74,255,0.5)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    Creating account…
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-600 text-xs mt-6">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-pxi-purple hover:text-pxi-purple/80 transition-colors"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

function HandleStatusIcon({ status }) {
    if (status === 'checking')
        return <Loader2 size={14} className="animate-spin text-zinc-500" />;
    if (status === 'available')
        return <CheckCircle2 size={14} className="text-green-400" />;
    if (status === 'taken' || status === 'invalid')
        return <XCircle size={14} className="text-red-400" />;
    return null;
}

function HandleStatusMessage({ status, handle }) {
    if (!handle) return null;
    if (status === 'invalid')
        return (
            <p className="text-zinc-600 text-xs mt-1.5">
                3–20 characters, letters, numbers, and underscores only
            </p>
        );
    if (status === 'taken')
        return <p className="text-red-400 text-xs mt-1.5">@{handle} is already taken</p>;
    if (status === 'available')
        return <p className="text-green-400 text-xs mt-1.5">@{handle} is available</p>;
    return null;
}
