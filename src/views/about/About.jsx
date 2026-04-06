import React from "react";
import AppStoreCtaPair from "@/components/links/AppStoreCtaPair";
import { Users, Heart, Camera } from "lucide-react";
const PartiesJPEG = "/images/parties.jpeg";
const GroupJPEG = "/images/group.jpeg";

const AboutPage = () => {
    return (
        <div className="relative overflow-hidden pt-32 pb-24">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-pxi-purple/5 blur-[120px] rounded-full -z-10"></div>

            {/* Section 1 */}
            <section className="container mx-auto px-6 mb-32 text-center lg:text-left">
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-12 uppercase max-w-4xl">
                    Built to Bring <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-500">
                        People Together
                    </span>
                </h1>

                <div className="glass-dark p-8 md:p-12 rounded-[3rem] border border-white/10 max-w-4xl shadow-2xl">
                    <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed italic">
                        PXI was created to solve a simple problem: the moments
                        that make an event unforgettable shouldn't get lost in
                        someone else's camera roll. We built PXI to unify the
                        entire experience—planning, capturing, and reliving—into
                        one seamless place.
                    </p>
                </div>
            </section>

            {/* Section 2 */}
            <section className="container mx-auto px-6 mb-40">
                <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-pxi-purple/20 blur-[60px] rounded-full opacity-50"></div>

                            <img
                                src={PartiesJPEG}
                                alt="Organizing Events"
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
                            Built From Lost Moments — <br />
                            <span className="text-zinc-500">
                                Designed To Keep Them Forever.
                            </span>
                        </h2>

                        <div className="space-y-6 text-lg text-zinc-400 font-medium leading-relaxed">
                            <p>
                                We used to throw incredible parties, nights full
                                of energy, people, and memories. But the best
                                photos always vanished into someone else's
                                camera roll. PXI exists so that never happens
                                again.
                            </p>

                            <p>
                                It started with a group of international friends
                                who loved bringing people together. We hosted
                                event after event, learning what makes a night
                                unforgettable… until the logistics grew louder
                                than the fun, and we stepped back.
                            </p>

                            <p className="text-white">
                                In our own private gatherings, a deeper
                                frustration appeared: moments were scattered
                                across dozens of phones. Months later, one of us
                                would uncover a buried photo, the perfect angle
                                of you—and that rediscovery felt electric.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3 */}
            <section className="bg-zinc-900/30 py-32 mb-40 border-y border-white/5 relative">
                <div className="container mx-auto px-6 text-center">
                    <div className="inline-block px-4 py-1 glass rounded-full mb-8">
                        <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                            THE TEAM
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-12">
                        People Behind <br />
                        <span className="text-pxi-purple">the Vision</span>
                    </h2>

                    <p className="text-zinc-500 text-xl md:text-2xl font-medium max-w-3xl mx-auto mb-16">
                        We're a small, mission-driven team, organizers,
                        builders, and storytellers, who started PXI to solve a
                        real problem: keep the joy of live events alive by
                        making memories effortless to capture and share.
                    </p>

                    <div className="max-w-5xl mx-auto relative group">
                        <div className="absolute inset-0 bg-pxi-purple/10 blur-[80px] rounded-full opacity-30"></div>

                        <img
                            src={GroupJPEG}
                            alt="Team Group"
                            className="relative z-10 w-full aspect-8/5 object-cover sm:rounded-[3rem] rounded-4xl border border-white/10 sm:min-h-[420px] min-h-[350px]   "
                        />
                    </div>
                </div>
            </section>

            {/* Section 4 */}
            <section className="container mx-auto px-6 mb-40">
                <div className="max-w-4xl mx-auto">
                    <div className="ticket-shape bg-gradient-to-br from-zinc-900 to-pxi-charcoal p-10 md:p-20 rounded-[3rem] border border-white/5 relative text-center">
                        <div className="absolute top-10 right-10 opacity-10">
                            <Heart size={120} />
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black mb-10 leading-none uppercase tracking-tighter">
                            Making Every <br />
                            Moment Count
                        </h2>

                        <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed mb-12">
                            Our mission is simple: to make it easy for people to
                            connect, celebrate, and remember. PXI is designed to
                            remove the stress from organizing and amplify the
                            joy of experiencing something together. Whether
                            digital or physical, every memory deserves to live
                            fully.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <Camera className="text-pxi-purple" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">
                                    Capture Everything
                                </span>
                            </div>

                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block"></div>

                            <div className="flex items-center gap-3">
                                <Users className="text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">
                                    Connect Deeply
                                </span>
                            </div>
                        </div>
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
