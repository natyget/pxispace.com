'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Cancel01Icon, Logout01Icon, DashboardSquare01Icon, ArrowDown01Icon, FavouriteIcon } from '@hugeicons/core-free-icons';
import { useAuth } from "../../contexts/AuthContext";
import { PxiLoadingIcon } from '@/components/loading/PxiLoading';
import UserAvatar from '@/components/ui/UserAvatar';

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
    /* The Events pill is the product gateway; hide it only on /events itself
       (that page owns its own center controls via the portal below). */
    const showEventsButton = pathname !== "/events";

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);
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
        { name: "Platform", path: "/platform" },
        { name: "About", path: "/about" },
    ];

    const linkClass = (path) =>
        pathname === path
            ? "text-white after:scale-x-100"
            : "text-white/50 hover:text-white after:scale-x-0";

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
                    {/* The bare glowing mark on a transparent canvas — no purple disc behind
                        it. The bar is already dark, so the badge treatment (app-icon.png) reads
                        as a sticker pasted on top. That variant is for the favicon and the app
                        icon, where a container shape is required; it is not the site nav mark. */}
                    <img
                        src="/logo-mark.png"
                        alt="PXI"
                        width={44}
                        height={44}
                        className="h-[38px] w-[38px] md:h-[44px] md:w-[44px] translate-y-[4px] object-contain"
                    />
                </Link>

                {/* Center: Marketing nav (plain editorial links) */}
                {pathname === "/events" ? (
                    <div id="navbar-center-portal" className="absolute left-1/2 -translate-x-1/2 items-center justify-center z-10 flex" />
                ) : (
                    <div className="hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-9 z-10 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`relative text-[11px] font-bold uppercase tracking-[0.2em] leading-none transition-colors after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-left after:bg-pxi-purple after:transition-transform after:duration-300 ${linkClass(link.path)}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Right: Product gateway + account */}
                <div className="flex h-[30px] items-center justify-end gap-3 md:h-10 md:gap-4">
                    {!mounted ? (
                        isLanding ? null : (
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center md:flex" aria-hidden>
                                <PxiLoadingIcon />
                            </div>
                        )
                    ) : (
                        <>
                            {mounted && isAuthenticated ? (
                                <div className="relative hidden md:block" ref={userMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setUserMenuOpen((v) => !v)}
                                        className="flex h-10 items-center gap-2 rounded-full bg-zinc-900/60 px-3 hover:bg-zinc-900/80 transition-all border-0 outline-none"
                                    >
                                        <UserAvatar user={user} size={24} alt={user?.name ?? ''} />
                                        <span className="text-white text-xs font-semibold max-w-[100px] truncate">
                                            {user?.name?.split(" ")[0] || "Account"}
                                        </span>
                                        <HugeiconsIcon icon={ArrowDown01Icon}
                                            size={12}
                                            className={`text-zinc-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-40 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] z-50 animate-fade-in">
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-xs font-semibold tracking-wide transition-all"
                                            >
                                                <HugeiconsIcon icon={DashboardSquare01Icon} size={14} className="text-zinc-400" />
                                                Dashboard
                                            </Link>
                                            <Link
                                                href="/wishlist"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-xs font-semibold tracking-wide transition-all"
                                            >
                                                <HugeiconsIcon icon={FavouriteIcon} size={14} className="text-zinc-400" />
                                                Wishlist
                                            </Link>
                                            <button
                                                onClick={() => { setUserMenuOpen(false); setShowLogoutModal(true); }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold tracking-wide transition-all"
                                            >
                                                <HugeiconsIcon icon={Logout01Icon} size={14} className="text-zinc-400" />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {mounted && !isAuthenticated ? (
                                <div className="hidden items-center gap-5 md:flex">
                                    <Link
                                        href={`/login?redirect=${encodeURIComponent(pathname)}`}
                                        className="text-xs font-bold text-zinc-300 transition-colors hover:text-white"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/login?mode=signup&redirect=/dashboard/events/new"
                                        className="inline-flex h-[34px] items-center rounded-full bg-white px-5 text-[11px] font-bold uppercase tracking-[0.1em] text-black transition-colors hover:bg-zinc-200"
                                    >
                                        Create Event
                                    </Link>
                                </div>
                            ) : null}

                            {showEventsButton ? (
                                <Link
                                    href="/events"
                                    className="glow-cta hidden h-[34px] items-center px-6 text-[11px] font-bold uppercase tracking-[0.2em] md:inline-flex"
                                >
                                    Events
                                </Link>
                            ) : null}
                        </>
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
                                <Link
                                    href="/events?wishlist=1"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-zinc-400"
                                >
                                    Wishlist
                                </Link>
                                <button
                                    onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }}
                                    className="text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 text-pxi-purple"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : null}

                        {/* Log in / Create belong in the hamburger on EVERY page —
                            gating them to /events left landing and event-detail
                            pages with no way to sign in from mobile. */}
                        {mounted && !isAuthenticated ? (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Link
                                    href={`/login?redirect=${encodeURIComponent(pathname || '/')}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex h-12 w-full items-center justify-center rounded-full bg-white/8 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-white/12"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/login?mode=signup&redirect=/dashboard/events/new"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="glow-cta flex h-12 w-full items-center justify-center text-sm font-black uppercase tracking-widest"
                                >
                                    Create
                                </Link>
                            </div>
                        ) : showEventsButton ? (
                            <Link
                                href="/events"
                                onClick={() => setMobileMenuOpen(false)}
                                className="glow-cta mt-4 flex h-12 w-full items-center justify-center text-sm font-black uppercase tracking-widest"
                            >
                                Events
                            </Link>
                        ) : null}
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
                    className="bg-zinc-950/65 backdrop-blur-[36px] border-0 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-white font-black text-lg mb-2 tracking-tight">Sign out?</h2>
                    <p className="text-zinc-400 text-sm mb-6">You'll need to sign in again to access your account.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex-1 px-5 py-3 rounded-full bg-pxi-purple text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all border-0"
                        >
                            Sign Out
                        </button>
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="flex-1 px-5 py-3 rounded-full bg-white/5 text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border-0"
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
