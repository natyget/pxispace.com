import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../lib/authService";

export default function Dashboard() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        setUser(null);
        navigate("/");
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>This is a protected dashboard area.</p>
            {user && (
                <div className="mt-4">
                    <div className="mb-2">Signed in as: {user.email}</div>
                    <button
                        className="bg-red-600 text-white px-3 py-1 rounded"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
