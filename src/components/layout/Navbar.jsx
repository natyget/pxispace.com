import React, { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import LogoSVG from "../../assets/logo.svg";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen]);

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        navigate("/");
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
        { name: "About", path: "/about" },
    ];

    const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || "?";

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b will-change-transform ${
                isScrolled || mobileMenuOpen
                    ? "py-4 bg-black/60 backdrop-blur-2xl border-white/5"
                    : "py-8 bg-transparent border-transparent"
            }`}
        >
            <div className="container mx-auto px-6 relative flex items-center justify-between">
                {/* Logo */}
                <NavLink
                    to="/"
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <img src={LogoSVG} alt="PXI Logo" className="h-8 w-8" />
                </NavLink>

                {/* Desktop Navigation (centered) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md gap-1">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                                    isActive
                                        ? "bg-pxi-purple text-white shadow-[0_0_20px_rgba(216,74,255,0.4)]"
                                        : "text-zinc-400 hover:text-white"
                                }`
                            }
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen((v) => !v)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-900/60 border border-white/8 hover:border-white/15 transition-all"
                            >
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-pxi-purple/30 border border-pxi-purple/40 flex items-center justify-center text-pxi-purple text-xs font-bold">
                                        {avatarFallback}
                                    </div>
                                )}
                                <span className="text-white text-xs font-semibold max-w-[100px] truncate">
                                    {user?.name?.split(" ")[0] || "Account"}
                                </span>
                                <ChevronDown
                                    size={12}
                                    className={`text-zinc-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-white/5">
                                        <p className="text-white text-xs font-semibold truncate">
                                            {user?.name}
                                        </p>
                                        <p className="text-zinc-500 text-xs truncate">
                                            @{user?.handle}
                                        </p>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-medium transition-all"
                                    >
                                        <LayoutDashboard size={13} />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/8 text-xs font-medium transition-all"
                                    >
                                        <LogOut size={13} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-5 py-2.5 rounded-full bg-pxi-purple text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_16px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                        >
                            Launch
                        </Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <>
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 z-40"
                    />
                    <div className="md:hidden absolute top-full left-0 w-full glass-car p-8 flex flex-col gap-6 animate-fade-up h-screen z-50 bg-black/95 backdrop-blur-3xl">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 ${
                                        isActive ? "text-white" : "text-zinc-400"
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-zinc-400"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-red-500"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-white"
                                >
                                    Launch
                                </Link>
                            </>
                        )}
                    </div>
                </>
            )}
        </header>
    );
};

export default Navbar;
