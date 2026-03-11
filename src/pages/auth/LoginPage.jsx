import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { FaApple, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import AuthParticles from '../../components/auth/AuthParticles';
import LogoSVG from '../../assets/logo.svg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const APPLE_SERVICE_ID = import.meta.env.VITE_APPLE_SERVICE_ID;

export default function LoginPage() {
    const navigate = useNavigate();
    const { saveAuth, isAuthenticated } = useAuth();
    const googleInitialized = useRef(false);
    // Hidden div that GSI renders its button into — we click it programmatically
    const hiddenGoogleBtnRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    // Always go to dashboard; PassportPage inside dashboard handles the unissued state
    const handleAuthSuccess = ({ token, user }) => {
        saveAuth({ token, user });
        navigate('/dashboard', { replace: true });
    };

    // Load Google GSI and render the real button into a hidden container.
    // Clicking our custom button programmatically clicks the rendered button,
    // which opens the standard "Choose an account" account-picker popup.
    useEffect(() => {
        if (googleInitialized.current) return;

        const init = () => {
            googleInitialized.current = true;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    try {
                        const result = await authService.googleAuth(response.credential);
                        handleAuthSuccess(result);
                    } catch {
                        navigate('/login/email', {
                            state: { error: 'Google sign-in failed. Please try again.' },
                        });
                    }
                },
            });
            // Render a minimal button — we just need the click handler GSI attaches
            if (hiddenGoogleBtnRef.current) {
                window.google.accounts.id.renderButton(hiddenGoogleBtnRef.current, {
                    type: 'standard',
                    size: 'large',
                    theme: 'filled_black',
                    width: 200,
                });
            }
        };

        if (window.google?.accounts?.id) { init(); return; }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = init;
        document.head.appendChild(script);
    }, []);

    // Load Apple JS
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

    // Click the GSI-rendered button → opens the standard "Choose an account" popup
    const handleGoogle = () => {
        const btn = hiddenGoogleBtnRef.current?.querySelector('div[role="button"]')
            ?? hiddenGoogleBtnRef.current?.firstElementChild;
        btn?.click();
    };

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
                navigate('/login/email', {
                    state: { error: 'Apple sign-in failed. Please try again.' },
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            <AuthParticles />

            {/* Hidden GSI button container — invisible but clickable via JS */}
            <div
                ref={hiddenGoogleBtnRef}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    top: 0,
                    left: 0,
                }}
            />

            {/* Logo / hero */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7">
                <div className="relative flex items-center justify-center mb-6">
                    <div
                        style={{
                            position: 'absolute',
                            width: 160,
                            height: 160,
                            borderRadius: '50%',
                            background: '#B026FF',
                            opacity: 0.22,
                            filter: 'blur(50px)',
                        }}
                    />
                    <img src={LogoSVG} alt="PXI" style={{ width: 110, height: 110, position: 'relative', zIndex: 1 }} />
                </div>

                <h1
                    className="font-black uppercase text-white"
                    style={{
                        fontSize: 36,
                        letterSpacing: '0.18em',
                        textShadow: '0 0 20px rgba(176,38,255,0.5)',
                        marginBottom: 8,
                    }}
                >
                    PXI STUDIO
                </h1>
                <p
                    className="uppercase font-bold"
                    style={{ fontSize: 10, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)' }}
                >
                    CITIZENSHIP BUREAU
                </p>
            </div>

            {/* Action buttons */}
            <div className="relative z-10 px-7 pb-10 w-full max-w-sm mx-auto">
                <GlassActionButton icon={<FaGoogle size={18} />} label="Continue with Google" onClick={handleGoogle} first />
                <GlassActionButton icon={<FaApple size={20} />} label="Continue with Apple" onClick={handleApple} />
                <GlassActionButton icon={<Mail size={18} />} label="Continue with Email" onClick={() => navigate('/login/email')} last />

                <p
                    className="text-center mt-7"
                    style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: '0.08em', lineHeight: 1.7 }}
                >
                    By continuing you agree to our{' '}
                    <Link to="/terms_of_service" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Terms</Link>
                    {' '}&amp;{' '}
                    <Link to="/privacy_policy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}

function GlassActionButton({ icon, label, onClick, first, last }) {
    const radius = first ? '16px 16px 0 0' : last ? '0 0 16px 16px' : '0';
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between transition-all active:scale-[0.99]"
            style={{
                height: 56,
                background: '#1c1c1c',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: radius,
                paddingLeft: 24,
                paddingRight: 24,
                marginTop: first ? 0 : -1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#252525'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1c1c1c'; }}
        >
            <span className="font-black text-white uppercase" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
                {label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 12, display: 'flex' }}>
                {icon}
            </span>
        </button>
    );
}
