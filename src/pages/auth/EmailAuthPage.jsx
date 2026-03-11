import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import AuthParticles from '../../components/auth/AuthParticles';

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

export default function EmailAuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { saveAuth } = useAuth();

    // mode can be pre-set via ?mode=signup
    const params = new URLSearchParams(location.search);
    const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');

    const [email, setEmail] = useState('');
    const [handle, setHandle] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(location.state?.error || '');
    const [handleStatus, setHandleStatus] = useState('idle');

    const debouncedHandle = useDebounce(handle, 500);

    const handleAuthSuccess = useCallback(
        ({ token, user }) => {
            saveAuth({ token, user });
            navigate('/dashboard', { replace: true });
        },
        [saveAuth, navigate]
    );

    // Handle availability check (signup mode only)
    useEffect(() => {
        if (mode !== 'signup' || !debouncedHandle) { setHandleStatus('idle'); return; }
        if (!HANDLE_REGEX.test(debouncedHandle)) { setHandleStatus('invalid'); return; }
        setHandleStatus('checking');
        authService
            .checkHandle(debouncedHandle)
            .then(({ available }) => setHandleStatus(available ? 'available' : 'taken'))
            .catch(() => setHandleStatus('idle'));
    }, [debouncedHandle, mode]);

    // Reset fields when mode changes
    const switchMode = (next) => {
        setMode(next);
        setError('');
        setHandle('');
        setPassword('');
        setConfirmPassword('');
        setHandleStatus('idle');
    };

    const passwordRules = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
    const passwordValid = passwordRules.every((r) => r.passed);
    const passwordsMatch = password === confirmPassword && confirmPassword !== '';

    const canSubmit = mode === 'login'
        ? email && password && !loading
        : email && HANDLE_REGEX.test(handle) && handleStatus === 'available' && passwordValid && passwordsMatch && !loading;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                const result = await authService.login(email, password);
                handleAuthSuccess(result);
            } else {
                const result = await authService.register(email, password, handle);
                saveAuth(result);
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            if (err.code === 'NO_PASSWORD') {
                setError('This account uses social login. Go back and use Google or Apple.');
            } else if (err.code === 'EMAIL_EXISTS') {
                setError('An account with this email already exists.');
            } else if (err.code === 'HANDLE_EXISTS') {
                setError('That handle is already taken.');
                setHandleStatus('taken');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === 'login';

    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            <AuthParticles />

            {/* Back button */}
            <button
                onClick={() => navigate('/login')}
                className="absolute top-5 left-5 z-20 flex items-center justify-center"
                style={{
                    padding: 10,
                    color: 'rgba(255,255,255,0.6)',
                    borderRadius: 9999,
                    background: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
                <ChevronLeft size={28} />
            </button>

            {/* Scrollable content */}
            <div className="relative z-10 flex-1 overflow-y-auto flex flex-col">
                <div className="w-full max-w-sm mx-auto px-7 pt-24 pb-12 flex flex-col flex-1">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1
                            className="font-black uppercase text-white"
                            style={{
                                fontSize: 34,
                                letterSpacing: '0.18em',
                                textShadow: '0 0 20px rgba(176,38,255,0.5)',
                                marginBottom: 8,
                            }}
                        >
                            PXI STUDIO
                        </h1>
                        <p
                            className="uppercase font-bold"
                            style={{
                                fontSize: 10,
                                letterSpacing: '0.35em',
                                color: 'rgba(255,255,255,0.35)',
                            }}
                        >
                            {isLogin ? 'SESSION // RESUME' : 'IDENTITY // CREATE'}
                        </p>
                    </div>

                    {/* Mode toggle */}
                    <div
                        className="flex p-1 mb-8"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 12,
                        }}
                    >
                        {['login', 'signup'].map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className="flex-1 font-black uppercase transition-all"
                                style={{
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    borderRadius: 9,
                                    fontSize: 12,
                                    letterSpacing: '0.15em',
                                    background: mode === m ? '#B026FF' : 'transparent',
                                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
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
                        <AuthField label="EMAIL">
                            <AuthInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </AuthField>

                        {/* Handle (signup only) */}
                        {!isLogin && (
                            <AuthField label="HANDLE">
                                <div className="relative">
                                    <span
                                        className="absolute left-6 top-1/2 -translate-y-1/2 font-semibold select-none"
                                        style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}
                                    >
                                        @
                                    </span>
                                    <AuthInput
                                        type="text"
                                        value={handle}
                                        onChange={(e) =>
                                            setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))
                                        }
                                        placeholder="yourhandle"
                                        maxLength={20}
                                        style={{ paddingLeft: 32 }}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        {handleStatus === 'checking' && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                                        {handleStatus === 'available' && <CheckCircle2 size={14} style={{ color: '#4ade80' }} />}
                                        {(handleStatus === 'taken' || handleStatus === 'invalid') && <XCircle size={14} style={{ color: '#f87171' }} />}
                                    </div>
                                </div>
                                {handle && handleStatus === 'taken' && <FieldHint color="#f87171">@{handle} is already taken</FieldHint>}
                                {handle && handleStatus === 'available' && <FieldHint color="#4ade80">@{handle} is available</FieldHint>}
                                {handle && handleStatus === 'invalid' && <FieldHint color="rgba(255,255,255,0.3)">3–20 characters, letters, numbers, and _ only</FieldHint>}
                            </AuthField>
                        )}

                        {/* Password */}
                        <AuthField label="PASSWORD">
                            <div className="relative">
                                <AuthInput
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingRight: 52 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2"
                                    style={{ color: 'rgba(255,255,255,0.35)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                                            {r.passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                            {r.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AuthField>

                        {/* Confirm password — signup only */}
                        {!isLogin && (
                            <AuthField label="CONFIRM PASSWORD">
                                <AuthInput
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
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
                        <div className="relative mt-2" style={{ marginBottom: 28 }}>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full font-black uppercase transition-all"
                                style={{
                                    height: 56,
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: canSubmit
                                        ? 'linear-gradient(90deg, #B026FF 0%, #7A00CC 100%)'
                                        : 'linear-gradient(90deg, rgba(176,38,255,0.3) 0%, rgba(122,0,204,0.3) 100%)',
                                    color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
                                    fontSize: 13,
                                    letterSpacing: '0.15em',
                                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                                    position: 'relative',
                                    zIndex: 2,
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={14} className="animate-spin" />
                                        {isLogin ? 'INITIATING…' : 'CREATING…'}
                                    </span>
                                ) : isLogin ? (
                                    'INITIATE SESSION'
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
                    </form>

                    {/* Social login footer */}
                    <div className="flex gap-3 mt-auto">
                        <FooterPill onClick={() => navigate('/login')}>
                            SOCIAL LOGIN
                        </FooterPill>
                        <FooterPill onClick={() => navigate('/')}>
                            BACK TO HOME
                        </FooterPill>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function AuthField({ label, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <p
                className="font-bold uppercase"
                style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: 10,
                }}
            >
                {label}
            </p>
            {children}
        </div>
    );
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
            className="w-full text-white font-semibold outline-none transition-all"
            style={{
                height: 56,
                borderRadius: 20,
                background: focused ? '#252525' : '#1c1c1c',
                border: `1px solid ${focused ? activeFocus : 'rgba(255,255,255,0.05)'}`,
                boxShadow: focused ? `0 0 0 3px ${activeFocus.replace('0.5', '0.1')}` : 'none',
                fontSize: 14,
                letterSpacing: '0.03em',
                paddingLeft: 24,
                paddingRight: 24,
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

function FooterPill({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="flex-1 font-bold uppercase transition-all"
            style={{
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                fontSize: 10,
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.4)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
            {children}
        </button>
    );
}
