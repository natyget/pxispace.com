import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setUser } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const user = await login({ email, password });
            setUser(user);
            navigate(`/dashboard/${user?.id || ""}`);
        } catch (err) {
            setError(err?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h2 className="text-2xl mb-4">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm">Email</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm">Password</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                    />
                </div>
                {error && <div className="text-red-600">{error}</div>}
                <div>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        disabled={loading}
                        type="submit"
                    >
                        {loading ? "Logging in..." : "Log in"}
                    </button>
                </div>
            </form>
        </div>
    );
}
