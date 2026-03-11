import { createContext, useContext, useState, useCallback } from 'react';
import { authStorage } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => authStorage.getUser());
    const [token, setToken] = useState(() => authStorage.getToken());

    const saveAuth = useCallback(({ token: newToken, user: newUser }) => {
        authStorage.save({ token: newToken, user: newUser });
        setToken(newToken);
        setUser(newUser);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        const merged = { ...user, ...updatedUser };
        localStorage.setItem('pxi_user', JSON.stringify(merged));
        setUser(merged);
    }, [user]);

    const logout = useCallback(() => {
        authStorage.clear();
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
