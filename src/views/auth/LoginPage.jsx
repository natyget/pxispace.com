'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon } from '@hugeicons/core-free-icons';
import { FaApple, FaGoogle } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { defaultPostLoginPath } from '../../lib/dashboardPaths';

const APPLE_SERVICE_ID = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '';

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, saveAuth, isAuthenticated, updateUser, logout } = useAuth();
    const showVerifiedMessage = searchParams.get('verified') === '1';
    const redirectPath = searchParams.get('redirect');
    const safeRedirect = redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : null;

    // When already logged in (e.g. opened from mobile "Go to Web"), refresh user from API then redirect so dashboard sees up-to-date profile (e.g. phoneNumber).
    const hasRedirected = useRef(false);
    useEffect(() => {
        if (!isAuthenticated || !user?.id || hasRedirected.current) return;
        hasRedirected.current = true;
        authService.getMe(user.id)
            .then(({ user: fresh }) => {
                updateUser(fresh);
                const dest = safeRedirect || defaultPostLoginPath(fresh);
                // Let the auth context update before navigating so dashboard sees phoneNumber
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

    const handleAuthSuccess = async ({ token, user }) => {
        await saveAuth({ token, user });
        router.replace(safeRedirect || defaultPostLoginPath(user));
    };

    // OAuth2 token flow with prompt so user sees: (1) account selection, (2) Cancel/Continue consent
    const loginWithGoogle = useGoogleLogin({
        flow: 'implicit',
        scope: '',
        prompt: 'select_account consent',
        onSuccess: async (tokenResponse) => {
            try {
                const result = await authService.googleTokenAuth(tokenResponse.access_token);
                handleAuthSuccess(result);
            } catch {
                router.push('/login/email?error=' + encodeURIComponent('Google sign-in failed. Please try again.'));
            }
        },
        onError: () => {
            router.push('/login/email?error=' + encodeURIComponent('Google sign-in failed. Please try again.'));
        },
    });

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
                router.push('/login/email?error=' + encodeURIComponent('Apple sign-in failed. Please try again.'));
            }
        }
    };

    return (
        <div className="legal-hub min-h-screen bg-legal-hub-bg text-legal-hub-text selection:bg-legal-hub-accent selection:text-black flex flex-col relative overflow-hidden">
            {/* Post-signup message: please log in again to complete profile */}
            {showVerifiedMessage && (
                <div
                    className="relative z-20 mx-4 mt-6 rounded-xl px-4 py-3 text-center text-sm font-semibold bg-legal-hub-surface border border-legal-hub-border text-legal-hub-accent"
                >
                    Please log in again to complete your profile.
                </div>
            )}

            {/* Top Text */}
            <div className="relative z-10 w-full flex flex-col items-center px-7 pt-16 md:pt-20">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9] text-[#E0E0E0] text-center">
                    PXI STUDIO
                </h1>
                <p className="text-sm md:text-base text-pxi-purple font-medium tracking-widest mt-3 italic uppercase drop-shadow-[0_0_8px_rgba(216,74,255,0.4)]">
                    Citizenship Bureau
                </p>
            </div>

            {/* Center Logo */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 pointer-events-none">
                <Image 
                    src="/images/logo.svg" 
                    alt="PXI Logo" 
                    width={220} 
                    height={220} 
                    className="w-44 h-44 md:w-52 md:h-52 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                    priority 
                />
            </div>

            {/* Action buttons */}
            <div className="relative z-10 px-7 pb-10 w-full max-w-sm mx-auto">

                {/* Google — OAuth2 token flow so user sees account selection then Cancel/Continue consent */}
                <button
                    type="button"
                    onClick={() => loginWithGoogle()}
                    className="w-full flex items-center justify-between transition-all active:scale-[0.99] bg-legal-hub-surface border border-legal-hub-border hover:bg-[#1a1a1a]"
                    style={{
                        height: 56,
                        borderRadius: '16px 16px 0 0',
                        paddingLeft: 24, paddingRight: 24,
                    }}
                >
                    <span className="font-black text-white uppercase" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
                        Continue with Google
                    </span>
                    <FaGoogle size={18} style={{ color: 'rgba(255,255,255,0.45)' }} />
                </button>

                {/* Apple */}
                <GlassActionButton icon={<FaApple size={20} />} label="Continue with Apple" onClick={handleApple} />

                {/* Email */}
                <GlassActionButton icon={<HugeiconsIcon icon={Mail01Icon} size={18} />} label="Continue with Email" onClick={() => router.push(safeRedirect ? `/login/email?redirect=${encodeURIComponent(safeRedirect)}` : '/login/email')} last />

                <p className="text-center mt-7" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.02em', lineHeight: 1.55 }}>
                    By signing up, you agree to our{' '}
                    <Link href="/terms_of_service" className="text-legal-hub-accent underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy_policy" className="text-legal-hub-accent underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}

function GlassActionButton({ icon, label, onClick, last }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between transition-all active:scale-[0.99] bg-legal-hub-surface border border-legal-hub-border hover:bg-[#1a1a1a]"
            style={{
                height: 56,
                borderRadius: last ? '0 0 16px 16px' : '0',
                paddingLeft: 24, paddingRight: 24, marginTop: -1,
            }}
        >
            <span className="font-black text-white uppercase" style={{ fontSize: 13, letterSpacing: '0.1em' }}>{label}</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 12, display: 'flex' }}>{icon}</span>
        </button>
    );
}
