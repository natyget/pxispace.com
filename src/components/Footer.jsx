import { Link } from "react-router-dom";
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube } from "react-icons/fi";
import { FaApple, FaGooglePlay } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="relative border-t border-white/6 bg-card/60 backdrop-blur-md">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Brand + Description */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">
                            PXI
                        </h3>
                        <p className="text-muted-foreground max-w-sm text-white/70">
                            Bringing instant printing back to the digital
                            generation, professional, private, and simple for
                            every event.
                        </p>

                        <div className="flex items-center gap-4 mt-4">
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-white/90 transition-colors text-xl"
                            >
                                <FiInstagram />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-white/90 transition-colors text-xl"
                            >
                                <FiTwitter />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-white/90 transition-colors text-xl"
                            >
                                <FiFacebook />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-white/90 transition-colors text-xl"
                            >
                                <FiYoutube />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold mb-4 text-white">
                                Product
                            </h4>
                            <ul className="space-y-2 text-white/70">
                                <li>
                                    <Link
                                        to="/features"
                                        className="text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/tech"
                                        className="text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Technology
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/shop"
                                        className="text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Shop
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-white">
                                Company
                            </h4>
                            <ul className="space-y-2 text-white/70">
                                <li>
                                    <Link
                                        to="/about"
                                        className="text-muted-foreground hover:text-white transition-colors"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/support"
                                        className="text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Support
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* App downloads */}
                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-muted-foreground mb-4 text-right md:text-left md:text-sm max-w-xs">
                            Download PXI and join the event experience, capture,
                            share, and relive instantly.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch gap-3">
                            <a
                                href="#"
                                className="flex items-center gap-3 px-6 h-12 rounded-2xl border border-purple-500/20 bg-transparent text-white transition-shadow duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.45)] border-glow w-44"
                            >
                                <FaApple className="text-xl" />
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground">
                                        Download on the
                                    </div>
                                    <div className="text-sm font-semibold">
                                        App Store
                                    </div>
                                </div>
                            </a>

                            <a
                                href="#"
                                className="flex items-center gap-3 px-6 h-12 rounded-2xl border border-purple-500/20 bg-transparent text-white transition-shadow duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.45)] border-glow w-40"
                            >
                                <FaGooglePlay className="text-xl" />
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground">
                                        Get it on
                                    </div>
                                    <div className="text-sm font-semibold">
                                        Google Play
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-4" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                        <p>&copy; 2025 PXI Labs LLC. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/terms"
                                className="hover:text-white transition-colors"
                            >
                                Terms
                            </Link>
                            <Link
                                to="/privacy"
                                className="hover:text-white transition-colors"
                            >
                                Privacy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
