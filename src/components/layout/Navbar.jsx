'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
const LogoSrc = "/Union.svg";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
    const [mounted, setMounted] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const { isAuthenticated, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isLanding = pathname === "/";

    useEffect(() => setMounted(true), []);
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        router.push("/");
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
        { name: "About", path: "/about" },
    ];

    const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || "?";

    const linkClass = (path) =>
        pathname === path
            ? "bg-pxi-purple text-white shadow-[0_0_20px_rgba(216,74,255,0.4)]"
            : "text-zinc-400 hover:text-white";

    return (
        <>
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b will-change-transform ${
                isLanding
                    ? "py-2 bg-transparent border-transparent backdrop-blur-0"
                    : isScrolled || mobileMenuOpen
                      ? "py-2.5 bg-transparent border-transparent"
                      : "py-8 bg-transparent border-transparent"
            }`}
        >
            <div className="container mx-auto grid grid-cols-[1fr_auto] items-center gap-x-4 px-6 md:grid-cols-[1fr_auto_1fr]">
                <Link
                    href="/"
                    className="flex h-10 min-w-0 items-center justify-self-start gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <Image
                        src={LogoSrc}
                        alt="PXI Logo"
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 object-contain"
                        priority
                    />
                </Link>

                <div className={`col-start-2 row-start-1 hidden items-center justify-self-center md:col-start-2 z-10 bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md gap-1 ${isLanding ? "lg:flex" : "md:flex"}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex h-9 items-center px-5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${linkClass(link.path)}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="col-start-2 row-start-1 flex h-10 items-center justify-end justify-self-end gap-3 md:col-start-3">
                    {!mounted ? (
                        /* Skeleton while auth state loads */
                        <div className="hidden h-9 w-28 shrink-0 rounded-full bg-zinc-800/60 animate-pulse md:block" />
                    ) : isAuthenticated ? (
                        <div className="relative hidden md:block" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen((v) => !v)}
                                className="flex h-10 items-center gap-2 rounded-full border border-white/8 bg-zinc-900/60 px-3 hover:border-white/15 transition-all"
                            >
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user?.name ?? ''}
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
                                        <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                                        <p className="text-zinc-500 text-xs truncate">@{user?.username}</p>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-medium transition-all"
                                    >
                                        <LayoutDashboard size={13} />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => { setUserMenuOpen(false); setShowLogoutModal(true); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-zinc-500 hover:text-pxi-purple hover:bg-pxi-purple/10 text-xs font-medium transition-all"
                                    >
                                        <LogOut size={13} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden h-10 items-center rounded-full bg-pxi-purple px-5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all md:inline-flex"
                        >
                            Launch
                        </Link>
                    )}
                    <button
                        type="button"
                        className="flex h-10 w-10 shrink-0 items-center justify-center text-white md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <>
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 z-40"
                    />
                    <div className="md:hidden absolute top-full left-0 w-full glass-car p-8 flex flex-col gap-6 animate-fade-up h-screen z-50 bg-black/95 backdrop-blur-3xl">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 ${
                                    pathname === link.path ? "text-white" : "text-zinc-400"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {mounted && isAuthenticated ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-zinc-400"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-pxi-purple"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-white"
                            >
                                Launch
                            </Link>
                        )}
                    </div>
                </>
            )}
        </header>

        {/* Sign-out confirmation modal */}
        {showLogoutModal && (
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={() => setShowLogoutModal(false)}
            >
                <div
                    className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-white font-black text-lg mb-2 tracking-tight">Sign out?</h2>
                    <p className="text-zinc-400 text-sm mb-6">You'll need to sign in again to access your account.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm hover:bg-pxi-purple/90 transition-all"
                        >
                            Sign Out
                        </button>
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 font-medium text-sm hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default Navbar;
