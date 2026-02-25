import React, { useState, useEffect } from "react";
import { Menu, X, UserPlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../ui/Button";
import LogoSVG from "../../assets/logo.svg";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent body scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
        { name: "About", path: "/about" },
    ];

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

                {/* Action Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <button className="p-2.5 text-zinc-400 hover:text-white transition-colors hover:bg-white/10 rounded-full">
                        <UserPlus size={20} />
                    </button>

                    <Button
                        variant="neon"
                        className="px-7 !py-2.5 !text-xs !tracking-[0.1em] uppercase"
                    >
                        Get App
                    </Button>
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
                        className="fixed inset-0 z-40 "
                    />
                    <div className="md:hidden absolute top-full left-0 w-full glass-car p-8 flex flex-col gap-6 animate-fade-up h-screen z-50  bg-black/95 backdrop-blur-3xl">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `text-left text-2xl font-black uppercase tracking-widest pb-4 border-b border-white/5 ${
                                        isActive
                                            ? "text-white"
                                            : "text-zinc-400"
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}

                        <Button
                            variant="neon"
                            className="w-full uppercase tracking-widest mt-4"
                        >
                            Get App
                        </Button>
                    </div>
                </>
            )}
        </header>
    );
};

export default Navbar;
