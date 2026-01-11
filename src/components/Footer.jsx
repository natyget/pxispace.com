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
                        <div className="group inline-block">
                            <h3 className="text-2xl md:text-3xl font-extrabold heading-gradient transition-shadow duration-300 group-hover:shadow-[0_6px_30px_rgba(139,92,246,0.18)]">
                                <span className="inline-block transform transition-transform duration-300 group-hover:-translate-y-0.5">
                                    PXI
                                </span>
                            </h3>
                        </div>

                        <p className="text-white/70 max-w-sm leading-6 text-sm md:text-sm">
                            Professional instant printing experiences for
                            events, private by design, simple by intent.
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                            <a
                                href="#"
                                aria-label="Instagram"
                                className="text-white/70 hover:text-white transition-colors duration-300 rounded-full p-2 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)] transform-gpu"
                            >
                                <FiInstagram className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                aria-label="Twitter"
                                className="text-white/70 hover:text-white transition-colors duration-300 rounded-full p-2 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)] transform-gpu"
                            >
                                <FiTwitter className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                aria-label="Facebook"
                                className="text-white/70 hover:text-white transition-colors duration-300 rounded-full p-2 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)] transform-gpu"
                            >
                                <FiFacebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                aria-label="YouTube"
                                className="text-white/70 hover:text-white transition-colors duration-300 rounded-full p-2 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)] transform-gpu"
                            >
                                <FiYoutube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold mb-4 text-white">
                                Product
                            </h4>
                            <ul className="space-y-3 text-white/70">
                                <li>
                                    <Link
                                        to="/"
                                        className="text-white/70 hover:text-purple-300 transition-colors duration-200 hover:underline hover:underline-offset-4"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/features"
                                        className="text-white/70 hover:text-purple-300 transition-colors duration-200 hover:underline hover:underline-offset-4"
                                    >
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/pre-order"
                                        className="text-white/70 hover:text-purple-300 transition-colors duration-200 hover:underline hover:underline-offset-4"
                                    >
                                        Pre-Order
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-white">
                                Company
                            </h4>
                            <ul className="space-y-3 text-white/70">
                                <li>
                                    <Link
                                        to="/about"
                                        className="text-white/70 hover:text-purple-300 transition-colors duration-200 hover:underline hover:underline-offset-4"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/support"
                                        className="text-white/70 hover:text-purple-300 transition-colors duration-200 hover:underline hover:underline-offset-4"
                                    >
                                        Support
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="mailto:contact@pxi.space.com"
                                        className="text-white/70 hover:text-purple-300 transition-colors duration-200 hover:underline hover:underline-offset-4"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* App downloads */}
                    <div className="flex flex-col  items-center ">
                        <p className="text-white/70 mb-4 text-center md:text-left md:text-sm max-w-xs leading-relaxed">
                            Download PXI and join the event experience, capture,
                            share, and relive instantly.
                        </p>

                        <div className="   flex flex-col  gap-3 items-center ">
                            <a
                                href="#"
                                className="flex items-center gap-3 px-5 h-12 rounded-2xl border border-purple-500/20 bg-transparent text-white transition-transform duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.22)] hover:scale-105"
                                aria-label="Download on the App Store"
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
                                className="flex items-center gap-3 px-5 h-12 rounded-2xl border border-purple-500/20 bg-transparent text-white transition-transform duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.22)] hover:scale-105"
                                aria-label="Get it on Google Play"
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
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent mb-4 opacity-60" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <p className="text-white/60">
                            &copy; {new Date().getFullYear()} PXI Labs LLC. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link
                                to="/terms_of_service"
                                className="text-white/70 hover:text-purple-300 transition-colors duration-150"
                            >
                                Terms
                            </Link>
                            <Link
                                to="/privacy_policy"
                                className="text-white/70 hover:text-purple-300 transition-colors duration-150"
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
