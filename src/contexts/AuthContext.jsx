'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authStorage, authService } from '../services/auth';

const AuthContext = createContext(null);

function shouldClearAuth(error) {
    const status = error?.status;
    const code = error?.code;
    return status === 401 || status === 403 || status === 404 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN';
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => authStorage.getUser());
    const [token, setToken] = useState(() => authStorage.getToken());

    // Refresh user data on mount so isVendor / accountTier are always fresh
    useEffect(() => {
        const storedToken = authStorage.getToken();
        const storedUser = authStorage.getUser();
        if (!storedToken || !storedUser?.id) return;
        authService.getMe(storedUser.id)
            .then(({ user: fresh }) => {
                const merged = { ...storedUser, ...fresh };
                localStorage.setItem('pxi_user', JSON.stringify(merged));
                setUser(merged);
            })
            .catch(async (error) => {
                if (shouldClearAuth(error)) {
                    await authStorage.clear();
                    setToken(null);
                    setUser(null);
                }
            });
    }, []);

    const saveAuth = useCallback(async ({ token: newToken, user: newUser }) => {
        await authStorage.save({ token: newToken, user: newUser });
        setToken(newToken);
        setUser(newUser);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        const merged = { ...user, ...updatedUser };
        localStorage.setItem('pxi_user', JSON.stringify(merged));
        setUser(merged);
    }, [user]);

    const logout = useCallback(async () => {
        await authStorage.clear();
        setToken(null);
        setUser(null);
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, saveAuth, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
