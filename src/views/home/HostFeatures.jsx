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

    // Phone / visual: lead the sequence on desktop only (on mobile, fade in immediately for smoothness)
    const phoneOpacity = useTransform(scrollYProgress, [0, 0.4], [0.4, 1]);
    const phoneX = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [-300, 0, 0, 0]);
    const phoneScale = useTransform(scrollYProgress, [0, 0.4], [0.8, 0.9]);
    // On mobile: override to normal (no transform/fade)
    // Text/content: follow after phone becomes visible (on mobile, fade immediately)
    const textOpacity = useTransform(scrollYProgress, [0.6, 1], [0, 1]);
    const textY = useTransform(scrollYProgress, [0.6, 1], [50, 0]);
    // Floating stats card: slightly faster parallax
    const statsY = useTransform(scrollYProgress, [0, 1], [15, -35]);

    return (
        <div ref={sectionRef} className="relative h-auto lg:h-[250vh]">
            <div className="block lg:sticky lg:top-[5rem] lg:h-screen flex items-center">
                <section
                    id="hosts"
                    className="w-full py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-b from-[#050505] to-[#1a0b2e] relative overflow-hidden"
                >
                    <div className="container mx-auto px-3 sm:px-4 md:px-6">
                        <div className="flex flex-col-reverse lg:flex-row items-center gap-16 md:gap-24">
                            {/* Content */}
                            <motion.div
                                className="w-full lg:w-1/2 text-center lg:text-left"
                                style={{
                                    // Only animate on desktop; on mobile always visible
                                    opacity: typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : textOpacity,
                                    y: typeof window !== "undefined" && window.innerWidth < 1024 ? 0 : textY,
                                }}
                            >
                                <div className="inline-block px-4 py-2 bg-pxi-purple/10 rounded-full text-pxi-purple font-black text-[10px] tracking-[0.2em] uppercase mb-6 sm:mb-8 border border-pxi-purple/20">
                                    ORGANIZERS & PROMOTERS
                                </div>

                                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 sm:mb-10 leading-[1.05] sm:leading-[0.9] uppercase tracking-tighter">
                                    Authentic Content <br />
                                    on{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
                                        Autopilot.
                                    </span>
                                </h2>

                                <div className="space-y-6 sm:space-y-8 md:space-y-10">
                                    <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-5 md:gap-6">
                                        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 glass rounded-full flex items-center justify-center border-white/10">
                                            <Calendar className="text-white w-5 h-5" />
                                        </div>
                                        <div className="max-w-md mt-2 sm:mt-0">
                                            <h3 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 uppercase tracking-tight">
                                                Frictionless Command Center
                                            </h3>
                                            <p className="text-zinc-500 font-medium text-[0.98rem]">
                                                Manage ticketing, invites, and
                                                communication in one place. Scale your
                                                events without the manual labor.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-5 md:gap-6">
                                        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 glass rounded-full flex items-center justify-center border-white/10">
                                            <ImageIcon className="text-pxi-purple w-5 h-5" />
                                        </div>
                                        <div className="max-w-md mt-2 sm:mt-0">
                                            <h3 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 uppercase tracking-tight">
                                                Social Momentum
                                            </h3>
                                            <p className="text-zinc-500 font-medium text-[0.98rem]">
                                                Every guest is a creator. Effortlessly
                                                collect high-quality content ready for
                                                your next promotion.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-5 md:gap-6">
                                        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 glass rounded-full flex items-center justify-center border-white/10">
                                            <Users className="text-blue-400 w-5 h-5" />
                                        </div>
                                        <div className="max-w-md mt-2 sm:mt-0">
                                            <h3 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 uppercase tracking-tight">
                                                Build Your Tribe
                                            </h3>
                                            <p className="text-zinc-500 font-medium text-[0.98rem]">
                                                Turn one-time ticket buyers into a loyal
                                                community that lives for your next drop.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 sm:mt-12 md:mt-16">
                                    <Button
                                        variant="neon"
                                        className="px-7 py-3 sm:px-10 sm:py-4 uppercase tracking-widest text-xs"
                                    >
                                        Start Creating Events
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Visual */}
                            <div className="w-full lg:w-1/2 relative flex justify-center mb-12 lg:mb-0">
                                <motion.div
                                    style={{ y: bgY }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] lg:w-[500px] lg:h-[500px] bg-pxi-purple/20 rounded-full blur-[70px] lg:blur-[100px] opacity-40 will-change-transform pointer-events-none"
                                ></motion.div>

                                <motion.div
                                    className="relative"
                                    style={{
                                        // Only animate on desktop, just show on mobile
                                        opacity: typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : phoneOpacity,
                                        x: typeof window !== "undefined" && window.innerWidth < 1024 ? 0 : phoneX,
                                        scale: typeof window !== "undefined" && window.innerWidth < 1024 ? 1 : phoneScale,
                                    }}
                                >
                                    <div className="relative z-10 flex items-center justify-center transform transition-transform duration-700 will-change-transform lg:rotate-3 lg:hover:rotate-0">
                                        <div className="bg-black p-2 sm:p-3 shadow-xl sm:shadow-2xl border-5  border-neutral-900 w-[200px] sm:w-[250px] md:w-[280px] lg:w-[360px] overflow-hidden rounded-3xl sm:rounded-4xl ">
                                            {/* Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 sm:h-6 w-20 sm:w-28 bg-neutral-900 rounded-b-xl z-20"></div>
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
                                                className="rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden bg-black"
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
                                        className="absolute -bottom-7 left-1/2 -translate-x-1/2 md:-left-12 md:translate-x-0 z-20 glass-dark border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl w-32 sm:w-40 md:w-48 animate-float"
                                        style={{
                                            y: statsY,
                                        }}
                                    >
                                        <p className="text-[9px] sm:text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
                                            Ticket Sales
                                        </p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-lg sm:text-xl md:text-2xl font-black text-white">
                                                1,204
                                            </span>
                                            <span className="text-xs text-green-400 font-bold mb-1">
                                                +12%
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/5 h-1 mt-2 sm:mt-3 rounded-full overflow-hidden">
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
