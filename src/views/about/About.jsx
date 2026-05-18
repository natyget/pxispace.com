import React from "react";
import AppStoreCtaPair from "@/components/links/AppStoreCtaPair";
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, UserGroupIcon, Shield01Icon } from '@hugeicons/core-free-icons';
const PartiesJPEG = "/images/parties.jpeg";
const GroupJPEG = "/images/group.jpeg";

const AboutPage = () => {
    return (
        <div className="relative overflow-hidden pt-32 pb-24">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-pxi-purple/5 blur-[120px] rounded-full -z-10"></div>

            {/* Section 1 — The Ethos */}
            <section className="container mx-auto px-6 mb-32 text-center lg:text-left">
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-12 uppercase max-w-4xl">
                    Immortalize <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-500">
                        the Night.
                    </span>
                </h1>

                <div className="glass-dark p-8 md:p-12 rounded-[3rem] border border-white/10 max-w-4xl shadow-2xl">
                    <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed italic">
                        PXI was forged to solve a critical flaw in modern social
                        life: the absolute best moments of our lives are held
                        hostage in isolated camera rolls. We engineered a
                        unified ecosystem to handle the logistics of the night,
                        so you can return to the reality of it.
                    </p>
                </div>
            </section>

            {/* Section 2 — The Genesis */}
            <section className="container mx-auto px-6 mb-40">
                <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-pxi-purple/20 blur-[60px] rounded-full opacity-50"></div>

                            <img
                                src={PartiesJPEG}
                                alt="PXI founders organizing a nightlife event"
                                className="relative z-10 w-full aspect-[4/5] md:aspect-[16/10] object-cover rounded-[3rem] border border-white/10 grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000"
                            />

                            <div className="absolute -bottom-6 -right-6 glass p-6 rounded-2xl border border-white/20 z-20 hidden md:block animate-float">
                                <p className="text-[10px] font-black tracking-[0.2em] text-pxi-purple uppercase">
                                    SINCE 2024
                                </p>
                                <p className="text-lg font-black text-white">
                                    UNFILTERED ENERGY
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 order-1 lg:order-2">
                        <h2 className="text-3xl md:text-5xl font-black mb-10 leading-tight uppercase tracking-tighter">
                            Built From Lost Moments. <br />
                            <span className="text-zinc-500">
                                Designed for Permanence.
                            </span>
                        </h2>

                        <div className="space-y-6 text-lg text-zinc-400 font-medium leading-relaxed">
                            <p>
                                Before we were building infrastructure, we were
                                operators. We hosted the nights that people
                                talked about for months. But a persistent
                                frustration kept surfacing: the actual lived
                                experience was electric, but the digital memory
                                of it was fragmented.
                            </p>

                            <p>
                                The energy of the night would scatter across
                                dozens of disconnected phones. Months later,
                                someone would unearth a buried photo—the perfect
                                angle, the exact vibe—and that rush of
                                rediscovery was undeniable.
                            </p>

                            <p className="text-white">
                                We realized the tools we were using were built
                                for broadcasting, not for experiencing. So, we
                                stepped back from the noise to build the
                                antidote.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3 — The Architects */}
            <section className="bg-zinc-900/30 py-32 mb-40 border-y border-white/5 relative">
                <div className="container mx-auto px-6 text-center">
                    <div className="inline-block px-4 py-1 glass rounded-full mb-8">
                        <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                            THE ARCHITECTS
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-12">
                        Behind <br />
                        <span className="text-pxi-purple">the Glass</span>
                    </h2>

                    <div className="max-w-3xl mx-auto mb-16 space-y-6">
                        <p className="text-zinc-500 text-xl md:text-2xl font-medium leading-relaxed">
                            PXI is operated by a global collective of event
                            producers, technical architects, and design
                            strategists. We didn&apos;t build this in a corporate
                            boardroom; we built it from the friction of real,
                            underground gatherings and high-stakes events.
                        </p>
                        <p className="text-zinc-600 text-lg font-medium leading-relaxed">
                            We intentionally operate behind the scenes. We
                            believe the focus of a social platform should never
                            be on the people who coded it, but on the
                            communities that use it. We provide the pitch-black
                            canvas and the neon infrastructure. You provide the
                            culture.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto relative group">
                        <div className="absolute inset-0 bg-pxi-purple/10 blur-[80px] rounded-full opacity-30"></div>

                        <img
                            src={GroupJPEG}
                            alt="The PXI collective"
                            className="relative z-10 w-full aspect-8/5 object-cover sm:rounded-[3rem] rounded-4xl border border-white/10 sm:min-h-[420px] min-h-[350px]   "
                        />
                    </div>
                </div>
            </section>

            {/* Section 4 — The Mandate */}
            <section className="container mx-auto px-6 mb-40">
                <div className="max-w-4xl mx-auto">
                    <div className="ticket-shape bg-gradient-to-br from-zinc-900 to-pxi-charcoal p-10 md:p-20 rounded-[3rem] border border-white/5 relative text-center">
                        <h2 className="text-4xl md:text-6xl font-black mb-10 leading-none uppercase tracking-tighter">
                            The PXI <br />
                            Mandate
                        </h2>

                        <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed mb-12">
                            Our mandate is simple: frictionless capture and
                            permanent legacy.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 pt-10 border-t border-white/10">
                            <div className="flex flex-col items-center gap-3 max-w-[200px]">
                                <HugeiconsIcon icon={Camera01Icon} className="text-pxi-purple" size={22} />
                                <span className="text-xs font-black uppercase tracking-[0.15em] text-white">
                                    Frictionless Connection
                                </span>
                                <span className="text-[11px] text-zinc-600 font-medium leading-snug text-center">
                                    Stripping the anxiety out of the &ldquo;Before&rdquo;
                                </span>
                            </div>

                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block"></div>

                            <div className="flex flex-col items-center gap-3 max-w-[200px]">
                                <HugeiconsIcon icon={UserGroupIcon} className="text-pink-400" size={22} />
                                <span className="text-xs font-black uppercase tracking-[0.15em] text-white">
                                    Tactile Reality
                                </span>
                                <span className="text-[11px] text-zinc-600 font-medium leading-snug text-center">
                                    Living completely in the &ldquo;During&rdquo;
                                </span>
                            </div>

                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block"></div>

                            <div className="flex flex-col items-center gap-3 max-w-[200px]">
                                <HugeiconsIcon icon={Shield01Icon} className="text-violet-400" size={22} />
                                <span className="text-xs font-black uppercase tracking-[0.15em] text-white">
                                    Permanent Legacy
                                </span>
                                <span className="text-[11px] text-zinc-600 font-medium leading-snug text-center">
                                    Earning your history in the &ldquo;After&rdquo;
                                </span>
                            </div>
                        </div>

                        <p className="mt-10 text-sm font-black text-zinc-600 uppercase tracking-widest">
                            We build the tools. You own the night.
                        </p>
                    </div>
                </div>
            </section>

            {/* Closing */}
            <section className="container mx-auto px-6 text-center">
                <h3 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800 mb-8">
                    Join Us
                </h3>

                <p className="text-zinc-500 text-xl font-bold uppercase tracking-widest mb-12">
                    HELP US SHAPE THE FUTURE OF EVENTS
                </p>

                <AppStoreCtaPair className="max-w-xl mx-auto" />
            </section>
        </div>
    );
};

export default AboutPage;
