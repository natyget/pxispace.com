import React, { useRef } from "react";
import { Calendar, Image as ImageIcon, Users } from "lucide-react";
import Button from "./../../components/ui/Button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { motion, useScroll, useTransform } from "framer-motion";
const DiscoverPNG = "/images/discover.PNG";
const CreatePNG = "/images/create.PNG";

const HostFeatures = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    // Background blur moves slowly for depth
    const bgY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

    // Phone / visual: lead the sequence
    const phoneOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
    const phoneX = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [-100, 0, 0, 60]);
    const phoneScale = useTransform(scrollYProgress, [0, 0.4], [0.95, 1]);

    // Text/content: follow after phone becomes visible
    const textOpacity = useTransform(scrollYProgress, [0.6, 1], [0, 1]);
    const textY = useTransform(scrollYProgress, [0.6, 1], [50, 0]);

    // Floating stats card: slightly faster parallax
    const statsY = useTransform(scrollYProgress, [0, 1], [15, -35]);

    return (
        <div ref={sectionRef} className="relative h-[250vh]">
            <div className="sticky top-0 h-screen flex items-center">
                <section
                    id="hosts"
                    className="w-full py-24 md:py-32 bg-gradient-to-b from-[#050505] to-[#1a0b2e] relative overflow-hidden"
                >
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                    {/* Content */}
                    <motion.div
                        className="lg:w-1/2 text-center lg:text-left"
                        style={{
                            opacity: textOpacity,
                            y: textY,
                        }}
                    >
                        <div className="inline-block px-4 py-2 bg-pxi-purple/10 rounded-full text-pxi-purple font-black text-[10px] tracking-[0.2em] uppercase mb-8 border border-pxi-purple/20">
                            ORGANIZERS & PROMOTERS
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black mb-10 leading-[0.9] uppercase tracking-tighter">
                            Authentic Content <br />
                            on{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
                                Autopilot.
                            </span>
                        </h2>

                        <div className="space-y-8 md:space-y-10">
                            <div className="flex flex-col md:flex-row items-center lg:items-start gap-5 md:gap-6">
                                <div className="flex-shrink-0 w-12 h-12 glass rounded-full flex items-center justify-center border-white/10">
                                    <Calendar className="text-white w-5 h-5" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-tight">
                                        Frictionless Command Center
                                    </h3>
                                    <p className="text-zinc-500 font-medium">
                                        Manage ticketing, invites, and
                                        communication in one place. Scale your
                                        events without the manual labor.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center lg:items-start gap-5 md:gap-6">
                                <div className="flex-shrink-0 w-12 h-12 glass rounded-full flex items-center justify-center border-white/10">
                                    <ImageIcon className="text-pxi-purple w-5 h-5" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-tight">
                                        Social Momentum
                                    </h3>
                                    <p className="text-zinc-500 font-medium">
                                        Every guest is a creator. Effortlessly
                                        collect high-quality content ready for
                                        your next promotion.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center lg:items-start gap-5 md:gap-6">
                                <div className="flex-shrink-0 w-12 h-12 glass rounded-full flex items-center justify-center border-white/10">
                                    <Users className="text-blue-400 w-5 h-5" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-tight">
                                        Build Your Tribe
                                    </h3>
                                    <p className="text-zinc-500 font-medium">
                                        Turn one-time ticket buyers into a loyal
                                        community that lives for your next drop.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 md:mt-16">
                            <Button
                                variant="neon"
                                className="px-10 py-4 uppercase tracking-widest text-xs"
                            >
                                Start Creating Events
                            </Button>
                        </div>
                    </motion.div>

                    {/* Visual */}
                    <div className="lg:w-1/2 relative flex justify-center w-full">
                        <motion.div
                            style={{ y: bgY }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pxi-purple/20 rounded-full blur-[100px] opacity-40 will-change-transform pointer-events-none"
                        ></motion.div>

                        <motion.div
                            className="relative"
                            style={{
                                opacity: phoneOpacity,
                                x: phoneX,
                                scale: phoneScale,
                            }}
                        >
                            <div className="relative z-10 flex items-center justify-center transform lg:rotate-3 lg:hover:rotate-0 transition-transform duration-700 will-change-transform">
                                <div className="bg-black p-3 shadow-2xl border-5  border-neutral-900 w-[280px] md:w-[360px] overflow-hidden rounded-4xl ">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-28 bg-neutral-900 rounded-b-xl z-20"></div>

                                    <Swiper
                                        spaceBetween={0}
                                        slidesPerView={1}
                                        pagination={{ clickable: true }}
                                        modules={[Pagination, Autoplay]}
                                        autoplay={{
                                            delay: 3500,
                                            disableOnInteraction: false,
                                        }}
                                        loop
                                        className="rounded-[1.5rem] overflow-hidden bg-black"
                                    >
                                        <SwiperSlide>
                                            <div className="aspect-[9/19] w-full overflow-hidden">
                                                <img
                                                    src={DiscoverPNG}
                                                    alt="Discover"
                                                    className="w-full h-full object-cover "
                                                />
                                            </div>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <div className="aspect-[9/19] w-full overflow-hidden">
                                                <img
                                                    src={CreatePNG}
                                                    alt="Create"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </SwiperSlide>
                                    </Swiper>
                                </div>
                            </div>

                            {/* Floating Stats Card */}
                            <motion.div
                                className="absolute -bottom-8 -left-4 md:-left-12 z-20 glass-dark border border-white/10 p-4 rounded-2xl shadow-2xl w-40 md:w-48 animate-float"
                                style={{
                                    y: statsY,
                                }}
                            >
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
                                    Ticket Sales
                                </p>

                                <div className="flex items-end gap-2">
                                    <span className="text-xl md:text-2xl font-black text-white">
                                        1,204
                                    </span>
                                    <span className="text-xs text-green-400 font-bold mb-1">
                                        +12%
                                    </span>
                                </div>

                                <div className="w-full bg-white/5 h-1.5 mt-3 rounded-full overflow-hidden">
                                    <div className="bg-pxi-purple h-full w-[85%] shadow-[0_0_10px_rgba(216,74,255,1)]"></div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HostFeatures;
