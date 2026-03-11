import React, { useState } from "react";
import ParticleBackground from "../components/ParticleBackground";
import { motion } from "framer-motion";
import { FiMail, FiClock, FiTag, FiPackage } from "react-icons/fi";
import NeonButton from "../components/NeonButton";
import Badge from "../components/Badge";

export default function PreOrderPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const submit = (e) => {
        e.preventDefault();
        setError("");
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!valid) return setError("Please enter a valid email");
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen relative bg-black py-20">
            <ParticleBackground />

            <div className="container mx-auto px-4">
                {/* SECTION 1 - WAITLIST HERO */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="py-20 flex flex-col items-center text-center"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold heading-gradient mb-6">
                        Join the Waitlist
                    </h1>

                    <form onSubmit={submit} className="w-full max-w-2xl">
                        <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-1 rounded-full bg-white/3 shadow-none border border-transparent">
                            <input
                                type="email"
                                aria-label="Email address"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 w-full rounded-full px-4 py-3 bg-transparent text-white placeholder:text-purple-300 outline-none border-none"
                            />
                            <NeonButton
                                type="submit"
                                variant="primary"
                                size="md"
                                className="rounded-full"
                            >
                                Sign Up
                            </NeonButton>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm mt-3">
                                {error}
                            </div>
                        )}

                        {!error && (
                            <p className="text-color-secondary mt-4">
                                Join now and lock 20% off PXIClip at launch.
                            </p>
                        )}

                        {submitted && (
                            <div className="mt-4 text-green-300">
                                Thanks! You&#39;re on the waitlist.
                            </div>
                        )}
                    </form>
                </motion.section>

                {/* SECTION 2 - WHY JOIN */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                    className="py-20"
                >
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-4 flex justify-center">
                            <Badge icon={FiMail} text="Why Join?" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-extrabold heading-gradient mb-4">
                            Why You Should Join the Waitlist
                        </h2>
                        <p className="text-color-secondary max-w-2xl mx-auto mb-8">
                            Get exclusive early access, priority stock, and
                            launch-only discounts. No spam, just perks.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                    <FiClock className="text-2xl text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Early Access
                                </h3>
                                <p className="text-white/70 text-sm">
                                    Be the first to experience PXIClip.
                                </p>
                            </div>

                            <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                    <FiTag className="text-2xl text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Exclusive Discount
                                </h3>
                                <p className="text-white/70 text-sm">
                                    Waitlist members get special launch pricing.
                                </p>
                            </div>

                            <div className="why-card group p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover-glow-subtle">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                                    <FiPackage className="text-2xl text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Priority Stock
                                </h3>
                                <p className="text-white/70 text-sm">
                                    Your unit is reserved before public release.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
