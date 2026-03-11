import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { FaApple, FaGoogle } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import AuthParticles from '../../components/auth/AuthParticles';
import LogoSVG from '../../assets/logo.svg';

const APPLE_SERVICE_ID = import.meta.env.VITE_APPLE_SERVICE_ID;

export default function LoginPage() {
    const navigate = useNavigate();
    const { saveAuth, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    const handleAuthSuccess = ({ token, user }) => {
        saveAuth({ token, user });
        navigate('/dashboard', { replace: true });
    };

    // @react-oauth/google — GoogleLogin gives credentialResponse.credential = ID token
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const result = await authService.googleAuth(credentialResponse.credential);
            handleAuthSuccess(result);
        } catch {
            navigate('/login/email', {
                state: { error: 'Google sign-in failed. Please try again.' },
            });
        }
    };

    // Load Apple Sign-In JS
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
                navigate('/login/email', {
                    state: { error: 'Apple sign-in failed. Please try again.' },
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            <AuthParticles />

            {/* Logo / hero */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7">
                <div className="relative flex items-center justify-center mb-6">
                    <div style={{
                        position: 'absolute', width: 160, height: 160,
                        borderRadius: '50%', background: '#B026FF',
                        opacity: 0.22, filter: 'blur(50px)',
                    }} />
                    <img src={LogoSVG} alt="PXI" style={{ width: 110, height: 110, position: 'relative', zIndex: 1 }} />
                </div>
                <h1
                    className="font-black uppercase text-white"
                    style={{ fontSize: 36, letterSpacing: '0.18em', textShadow: '0 0 20px rgba(176,38,255,0.5)', marginBottom: 8 }}
                >
                    PXI STUDIO
                </h1>
                <p className="uppercase font-bold" style={{ fontSize: 10, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)' }}>
                    CITIZENSHIP BUREAU
                </p>
            </div>

            {/* Action buttons */}
            <div className="relative z-10 px-7 pb-10 w-full max-w-sm mx-auto">

                {/* Google — PXI-styled visual layer + GoogleLogin as transparent overlay */}
                <div style={{ position: 'relative', height: 56 }}>
                    {/* Visual layer (non-interactive) */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingLeft: 24, paddingRight: 24,
                    }}>
                        <span className="font-black text-white uppercase" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
                            Continue with Google
                        </span>
                        <FaGoogle size={18} style={{ color: 'rgba(255,255,255,0.45)' }} />
                    </div>
                    {/* GoogleLogin overlay — opacity 0.01 keeps it invisible but the click is a real user gesture */}
                    <div style={{
                        position: 'absolute', inset: 0, overflow: 'hidden',
                        opacity: 0.01, borderRadius: '16px 16px 0 0', cursor: 'pointer',
                    }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() =>
                                navigate('/login/email', { state: { error: 'Google sign-in failed. Please try again.' } })
                            }
                            theme="filled_black"
                            size="large"
                            width="400"
                            useOneTap={false}
                        />
                    </div>
                </div>

                {/* Apple */}
                <GlassActionButton icon={<FaApple size={20} />} label="Continue with Apple" onClick={handleApple} />

                {/* Email */}
                <GlassActionButton icon={<Mail size={18} />} label="Continue with Email" onClick={() => navigate('/login/email')} last />

                <p className="text-center mt-7" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: '0.08em', lineHeight: 1.7 }}>
                    By continuing you agree to our{' '}
                    <Link to="/terms_of_service" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Terms</Link>
                    {' '}&amp;{' '}
                    <Link to="/privacy_policy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}

function GlassActionButton({ icon, label, onClick, last }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between transition-all active:scale-[0.99]"
            style={{
                height: 56, background: '#1c1c1c',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: last ? '0 0 16px 16px' : '0',
                paddingLeft: 24, paddingRight: 24, marginTop: -1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#252525'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1c1c1c'; }}
        >
            <span className="font-black text-white uppercase" style={{ fontSize: 13, letterSpacing: '0.1em' }}>{label}</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 12, display: 'flex' }}>{icon}</span>
        </button>
    );
}
