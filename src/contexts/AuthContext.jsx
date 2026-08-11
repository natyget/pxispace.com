'use client';
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authStorage, authService, ensurePasetoCookie } from '../services/auth';
import { faceService } from '../services/face';
import { clearUserId, setUserId, setUserPropertiesFromUser } from '../lib/analytics';
import { setEnhancedConversionData } from '../lib/enhancedConversions';

const AuthContext = createContext(null);

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [authRefreshing, setAuthRefreshing] = useState(true);
    // Face-enrollment status (null = unknown, boolean once loaded). Cached here so
    // album pages don't re-prompt already-enrolled users to scan (one status call/session).
    const [faceEnrolled, setFaceEnrolled] = useState(null);

    useEffect(() => {
        if (!token || !user?.id) {
            setFaceEnrolled(null);
            return undefined;
        }
        let cancelled = false;
        faceService
            .status()
            .then((res) => {
                if (!cancelled) setFaceEnrolled(Boolean(res?.enrolled));
            })
            .catch(() => {
                /* leave null (unknown) — album pages skip the auto-prompt rather than nag */
            });
        return () => {
            cancelled = true;
        };
    }, [token, user?.id]);

    // Hydrate from localStorage, re-sync HttpOnly cookie, then refresh role fields.
    // Cookie sync must finish before authReady so login auto-redirects hit middleware with a valid cookie.
    useEffect(() => {
        let cancelled = false;
        const frame = requestAnimationFrame(() => {
            void (async () => {
                const storedToken = authStorage.getToken();
                const storedUser = authStorage.getUser();
                if (cancelled) return;

                if (!storedToken || !storedUser?.id) {
                    setUser(storedUser);
                    setToken(storedToken);
                    setAuthReady(true);
                    setAuthRefreshing(false);
                    return;
                }

                setAuthRefreshing(true);
                // Re-bridge localStorage → HttpOnly cookie before exposing isAuthenticated.
                await ensurePasetoCookie(storedToken);
                if (cancelled) return;

                setUser(storedUser);
                setToken(storedToken);

                try {
                    const { user: fresh } = await authService.getMe(storedUser.id);
                    if (cancelled) return;
                    const merged = { ...storedUser, ...fresh };
                    localStorage.setItem('pxi_user', JSON.stringify(merged));
                    setUser(merged);
                } catch (error) {
                    if (cancelled) return;
                    if (shouldClearAuth(error)) {
                        await authStorage.clear();
                        if (cancelled) return;
                        setToken(null);
                        setUser(null);
                    }
                } finally {
                    if (!cancelled) {
                        setAuthReady(true);
                        setAuthRefreshing(false);
                    }
                }
            })();
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
        };
    }, []);

    const saveAuth = useCallback(async ({ token: newToken, user: newUser }) => {
        await authStorage.save({ token: newToken, user: newUser });
        setToken(newToken);
        setUser(newUser);
        setAuthReady(true);
        setAuthRefreshing(false);
        // Attach GA identity synchronously here rather than waiting for the
        // IdentityBridge effect: the auth pages redirect immediately after
        // saveAuth, so the effect can lose the race and the first hits of the
        // session would land without a user_id.
        setUserId(newUser?.id);
        setUserPropertiesFromUser(newUser);
        // Hashed-only (SHA-256, in-browser) and consent-gated inside the module.
        // Enriches the sign_up/login that just fired plus every later conversion.
        // Never awaited — a redirect must not wait on a digest.
        void setEnhancedConversionData({ email: newUser?.email, phone: newUser?.phoneNumber });
    }, []);

    const updateUser = useCallback((updatedUser) => {
        const merged = { ...(user || {}), ...updatedUser };
        localStorage.setItem('pxi_user', JSON.stringify(merged));
        setUser(merged);
        // The user record changed (tier, city, XP…) — resync the user-scoped dimensions.
        setUserPropertiesFromUser(merged);
    }, [user]);

    const logout = useCallback(async () => {
        await authStorage.clear();
        setToken(null);
        setUser(null);
        setAuthReady(true);
        setAuthRefreshing(false);
        // Drop user_id, the user-scoped dimensions and the hashed identifiers the
        // moment the session ends — not one render later. Matters on shared browsers.
        clearUserId();
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, authReady, authRefreshing, faceEnrolled, setFaceEnrolled, saveAuth, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
