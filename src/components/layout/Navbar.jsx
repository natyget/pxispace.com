'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Cancel01Icon, Logout01Icon, DashboardSquare01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
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
            ? "bg-gradient-to-r from-[#d946ef] to-[#c026d3] text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]"
            : "text-white/50 hover:text-white";

    return (
        <>
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 will-change-transform bg-black/80 backdrop-blur-md ${
                isScrolled || mobileMenuOpen
                    ? "py-[7.5px] md:py-3"
                    : "py-3 md:py-6"
            }`}
        >
            <div className="container mx-auto flex items-center justify-between px-6 relative">
                
                {/* Left: Brand Logo */}
                <Link
                    href="/"
                    className="flex min-w-0 items-center z-20"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <img src="/favicon.png" alt="PXI" className="h-[38px] md:h-[44px] translate-y-[4px] w-auto object-contain" />
                </Link>

                {/* Center: Toggle Menu */}
                <div className="hidden absolute left-1/2 -translate-x-1/2 items-center justify-center z-10 bg-[#131313] p-1 md:p-1.5 rounded-full md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-center h-[34px] px-8 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none transition-colors ${linkClass(link.path)}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex h-[30px] items-center justify-end gap-3 md:h-10 md:gap-3">
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
                                <HugeiconsIcon icon={ArrowDown01Icon}
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
                                        <HugeiconsIcon icon={DashboardSquare01Icon} size={13} />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => { setUserMenuOpen(false); setShowLogoutModal(true); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-zinc-500 hover:text-pxi-purple hover:bg-pxi-purple/10 text-xs font-medium transition-all"
                                    >
                                        <HugeiconsIcon icon={Logout01Icon} size={13} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden h-[34px] px-6 items-center justify-center rounded-full bg-pxi-purple text-white shadow-[0_0_20px_rgba(216,74,255,0.4)] text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] leading-none hover:scale-105 hover:brightness-110 transition-all duration-300 md:flex"
                        >
                            Sign Up
                        </Link>
                    )}
                    <button
                        type="button"
                        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-white md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? (
                            <HugeiconsIcon icon={Cancel01Icon} className="h-[21px] w-[21px]" strokeWidth={2} />
                        ) : (
                            <HugeiconsIcon icon={Menu01Icon} className="h-[21px] w-[21px]" strokeWidth={2} />
                        )}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <>
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 z-40"
                    />
                    <div className="md:hidden absolute top-full left-0 w-full p-8 flex flex-col gap-6 animate-fade-up h-screen z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
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
                                Sign Up
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
