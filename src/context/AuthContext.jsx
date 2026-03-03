import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../lib/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function syncAuth() {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        }

        syncAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
