'use client';
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authStorage, authService } from '../services/auth';
import { faceService } from '../services/face';

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

    // Hydrate from localStorage and immediately refresh role-sensitive fields.
    useEffect(() => {
        let cancelled = false;
        const frame = requestAnimationFrame(() => {
            const storedToken = authStorage.getToken();
            const storedUser = authStorage.getUser();
            if (cancelled) return;

            setUser(storedUser);
            setToken(storedToken);

            if (!storedToken || !storedUser?.id) {
                setAuthReady(true);
                setAuthRefreshing(false);
                return;
            }

            setAuthRefreshing(true);
            authService.getMe(storedUser.id)
                .then(({ user: fresh }) => {
                    if (cancelled) return;
                    const merged = { ...storedUser, ...fresh };
                    localStorage.setItem('pxi_user', JSON.stringify(merged));
                    setUser(merged);
                })
                .catch(async (error) => {
                    if (cancelled) return;
                    if (shouldClearAuth(error)) {
                        await authStorage.clear();
                        if (cancelled) return;
                        setToken(null);
                        setUser(null);
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setAuthReady(true);
                        setAuthRefreshing(false);
                    }
                });
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
    }, []);

    const updateUser = useCallback((updatedUser) => {
        const merged = { ...(user || {}), ...updatedUser };
        localStorage.setItem('pxi_user', JSON.stringify(merged));
        setUser(merged);
    }, [user]);

    const logout = useCallback(async () => {
        await authStorage.clear();
        setToken(null);
        setUser(null);
        setAuthReady(true);
        setAuthRefreshing(false);
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
