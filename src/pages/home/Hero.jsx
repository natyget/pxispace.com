import React, { useEffect, useRef } from "react";
import { Play, X, Download } from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import Button from "./../../components/ui/Button";
import PhoneMockup from "../../components/PhoneMockup";
import AlbumThread from "../../assets/album_thread.PNG";
import hero1 from "../../assets/hero1.png";

const Hero = () => {
    const bgRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (bgRef.current) {
                const scrolled = window.scrollY;
                bgRef.current.style.transform = `translate(-50%, ${scrolled * 0.4}px)`;
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 overflow-hidden">
            {/* Background Ambience */}
            <div
                ref={bgRef}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[1000px] bg-pxi-purple/10 blur-[150px] rounded-full pointer-events-none -z-10 opacity-60 will-change-transform"
            ></div>

            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                {/* Text Content */}
                <div className="text-center lg:text-left z-10">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
                        Perfect <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple via-pink-400 to-white">
                            Party{" "}
                        </span>
                        <br />
                        <span className="text-white">Platfrom.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        Stop juggling 5+ apps. PXI unifies ticketing, group
                        chats, and shared memories into one effortless
                        experience.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <a
                            href="#"
                            className="flex items-center gap-2 px-6 h-12 rounded-full text-white transition-all duration-300 neon-pill-outlet"
                        >
                            <FaApple size={18} />
                            <span className="text-sm font-black uppercase tracking-wider">
                                App Store
                            </span>
                        </a>

                        <a
                            href="#"
                            className="flex items-center gap-2 px-6 h-12 rounded-full text-white transition-all duration-300 neon-pill-outlet"
                        >
                            <FaGooglePlay size={18} />
                            <span className="text-sm font-black uppercase tracking-wider">
                                Google Play
                            </span>
                        </a>
                    </div>
                </div>

                {/* Phone Visuals */}
                <div className="relative h-[650px] w-full flex items-center justify-center lg:justify-end mt-12 lg:mt-0">
                    {/* Main Display Phone */}
                    <div className="relative z-10 w-80 md:w-96 transform hover:scale-105 transition-transform duration-700">
                        <div className="absolute -inset-4 bg-pxi-purple/20 blur-[60px] rounded-full animate-glow-pulse"></div>

                        <PhoneMockup
                            layers={[{ src: hero1, alt: "App Interface" }]}
                        />

                        {/* Notification Card */}
                        <div className="absolute top-1/4 -right-16 md:-right-24 z-20 w-72 p-4 rounded-[2rem] glass-dark border border-white/10 shadow-2xl animate-float">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map((i) => (
                                        <img
                                            key={i}
                                            src={`https://picsum.photos/40/40?random=${i + 50}`}
                                            className="w-10 h-10 rounded-full border-2 border-zinc-900"
                                            alt="Avatar"
                                        />
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-pxi-purple flex items-center justify-center text-[10px] font-black">
                                        +12
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <span>🔥</span>
                                    <span>🚀</span>
                                    <span>😂</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-white font-black text-lg leading-tight">
                                        Neon Nights
                                    </p>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                                        SENT AN INVITE
                                    </p>
                                </div>
                                <img
                                    src="https://picsum.photos/80/80?random=120"
                                    className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                                    alt="Event"
                                />
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button className="flex-1 bg-white text-black py-2 rounded-xl text-xs font-black uppercase">
                                    Accept
                                </button>
                                <button className="p-2 glass rounded-xl text-zinc-400">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Background Phone */}
                    <div className="absolute left-10 bottom-0 w-64 opacity-40 blur-[2px] -rotate-12 transform -translate-x-12 hidden lg:block">
                        <PhoneMockup
                            layers={[{ src: AlbumThread, alt: "Album Thread" }]}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
