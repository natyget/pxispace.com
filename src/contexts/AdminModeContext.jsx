'use client';

// Server-truth admin mode for the /dashboard/admin section.
//
// Every admin page used to gate Live-vs-Mock on a raw `user?.accountTier ===
// 'ADMIN'` read — but AuthContext refreshes the user from GET /api/auth/user/:id,
// which returns the RAW DB tier with no adminRole, overwriting the elevated
// login-time tier. Any account relying on session elevation flipped to a silent
// all-mock dashboard with every action hidden ("admin dashboard not functional").
//
// GET /api/admin/whoami is the backend's own answer to "is this request an
// admin, and which role" (it sits behind requireAdmin, so a 401/403 means NOT
// an admin). Pages read it via useAdminMode() instead of the raw tier.

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchAdminWhoami } from '@/services/admin';

const AdminModeContext = createContext({ isLive: false, adminRole: 'NONE', checked: false });

export function AdminModeProvider({ children }) {
    const [state, setState] = useState({ isLive: false, adminRole: 'NONE', checked: false });

    useEffect(() => {
        let cancelled = false;
        fetchAdminWhoami()
            .then((data) => {
                if (cancelled) return;
                setState({ isLive: true, adminRole: data?.adminRole ?? 'NONE', checked: true });
            })
            .catch(() => {
                if (cancelled) return;
                setState({ isLive: false, adminRole: 'NONE', checked: true });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Hold the section until the server answered — pages must never mount with a
    // provisional "not live" and flash mock data at a real admin.
    if (!state.checked) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-white/60 text-sm">
                Loading...
            </div>
        );
    }

    return <AdminModeContext.Provider value={state}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode() {
    return useContext(AdminModeContext);
}
