import { RiSparklingLine } from "react-icons/ri";
import { LuCamera } from "react-icons/lu";
import { FiZap, FiArrowRight } from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import { HiShieldCheck } from "react-icons/hi2";
import React, { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WhyPxi = ({ featuresRef }) => {
    useEffect(() => {
        if (!featuresRef?.current) return;

        const ctx = gsap.context(() => {
            gsap.from(".why-badge", {
                autoAlpha: 0,
                y: 10,
                duration: 0.5,
                ease: "power3.out",
            });
            gsap.from(".why-title", {
                autoAlpha: 0,
                y: 16,
                duration: 0.6,
                delay: 0.06,
                ease: "power3.out",
            });

            gsap.utils.toArray(".why-card").forEach((el, i) => {
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 88%",
                        toggleActions: "play none none reverse",
                    },
                    autoAlpha: 0,
                    y: 24,
                    duration: 0.6,
                    delay: i * 0.06,
                    ease: "power3.out",
                });
            });
        }, featuresRef);

        return () => ctx.revert();
    }, [featuresRef]);
    return (
        <section ref={featuresRef} className="relative px-4 py-24 lg:py-32">
            <div className="container mx-auto max-w-7xl">
                {/* Badge */}
                <div className="flex justify-center mb-12">
                    <div className="why-badge inline-flex items-center gap-2 border border-purple-500/40 bg-purple-500/10 backdrop-blur-sm rounded-full px-4 py-2 hover:border-purple-500/60 transition-colors duration-300">
                        <RiSparklingLine
                            className="text-purple-400"
                            size={18}
                        />
                        <span className="text-sm font-semibold text-purple-300">
                            Why People Love PXI
                        </span>
                    </div>
                </div>

                {/* Section Title & Description */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="why-title text-4xl  md:text-6xl  font-extrabold mb-6 leading-tight">
                        The Smarter Way{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
                            To Experience Any Event.
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                        PXI enhances how people capture, share, and revisit
                        event moments, with zero friction for organizers and
                        pure enjoyment for attendees.
                    </p>
                </div>

                {/* Two-Column Features */}
                <div className="grid gap-12 md:grid-cols-2 max-w-5xl mx-auto">
                    {/* Left Column */}
                    <div className="space-y-8">
                        {/* Feature 1 */}
                        <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                <LuCamera className="text-2xl text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Effortless Moments
                            </h3>
                            <p className="text-white/70 text-sm">
                                The app automatically saves and organizes every
                                photo so users never have to search.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                <FiZap className="text-2xl text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Real-Time Reactions
                            </h3>
                            <p className="text-white/70 text-sm">
                                Photos upload instantly so everyone at the event
                                can see highlights as they happen.
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Feature 3 */}
                        <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                <MdAdminPanelSettings className="text-2xl text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Organizer Control
                            </h3>
                            <p className="text-white/70 text-sm">
                                Hosts can manage what gets shared and how people
                                interact without doing extra work.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                <HiShieldCheck className="text-2xl text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Private & Secure Sharing
                            </h3>
                            <p className="text-white/70 text-sm">
                                Only invited guests can view or upload photos,
                                keeping every event safe and private.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhyPxi;
