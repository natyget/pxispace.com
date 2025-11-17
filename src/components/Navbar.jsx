import { useState } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "./NavLink";
import { FiMenu, FiX } from "react-icons/fi";
import { CgMenuLeft } from "react-icons/cg";

import NeonButton from "./NeonButton";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { name: "Home", path: "/" },
        { name: "Features", path: "/features" },
        { name: "About", path: "/about" },
        // { name: 'Shop', path: '/shop' },
        // { name: 'Tech', path: '/tech' },
        { name: "Support", path: "/support" },
    ];

    return (
        <nav className="fixed top-4 left-0 right-0 z-50 pointer-events-auto">
            <div className="container max-w-5xl mx-auto md:px-12">
                <div className="glass-nav mx-4 md:mx-0 px-4 py-2 rounded-4xl">
                    <div className="flex items-center justify-between h-11 relative">
                        {/* Left: Brand */}
                        <Link to="/" className="text-2xl font-bold text-neon">
                            PXI
                        </Link>

                        {/* Center: navigation links (centered absolute on desktop) */}
                        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8">
                            {links.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    className="text-foreground hover:text-primary transition-colors duration-300"
                                    activeClassName="text-neon font-extrabold"
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </div>

                        {/* Right: Pre-order button + mobile menu toggle */}
                        <div className="flex items-center space-x-3">
                            <div className="hidden md:block">
                                <NeonButton
                                    size="sm"
                                    className="animate-pulse-glow"
                                >
                                    Pre-Order
                                </NeonButton>
                            </div>

                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden text-foreground text-2xl"
                                aria-label="Toggle menu"
                            >
                                {isOpen ? (
                                    <FiX size={25} />
                                ) : (
                                    <CgMenuLeft size={28} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isOpen && (
                        <div className="md:hidden space-y-4 font-bold mx-4 my-12 px-2 text-center py-3 transition-all duration-500 h-[68svh] flex flex-col justify-center">
                            {links.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-foreground hover:text-primary transition-colors duration-300 py-2"
                                    activeClassName="text-neon font-extrabold"
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                            <NeonButton
                                size="sm"
                                className="w-full animate-pulse-glow"
                            >
                                Pre-Order
                            </NeonButton>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
