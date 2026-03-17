import React, { useState, useEffect, useRef } from "react";
import { Camera, Ticket, UserPlus, Heart } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { motion, useScroll, useTransform } from "framer-motion";
const EventPNG = "/images/event.PNG";
const AlbumThreadPNG = "/images/album_thread.PNG";
const PassportPNG = "/images/passport.png";
const CameraPNG = "/images/camera.PNG";
const VaultPNG = "/images/vault.PNG";

const features = [
    {
        icon: <Ticket className="w-6 h-6 text-pxi-purple" />,
        title: "Live the Nostalgia Now",
        tag: "PUBLIC • 2/10/2026",
        description:
            "Your ticket isn't just entry; it’s your key to the event’s shared camera roll.",
        images: [EventPNG, AlbumThreadPNG],
    },
    {
        icon: <UserPlus className="w-6 h-6 text-blue-400" />,
        title: "Your PXI Passport",
        tag: "PRIVATE • 2/12/2026",
        description: "Build a profile showcasing your stamps. It's your story.",
        images: [PassportPNG],
    },
    {
        icon: <Camera className="w-6 h-6 text-pink-500" />,
        title: "Effortless Capture",
        tag: "PUBLIC",
        description:
            "Fun filters and in-app camera make snapping and sharing the vibe seamless.",
        images: [CameraPNG, VaultPNG],
    },
];

const AttendeeFeatures = () => {
    // synchronized image index for all cards (rotates every 4.5s)
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setImageIndex((i) => i + 1);
        }, 4500);
        return () => clearInterval(id);
    }, []);

    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start bottom", "end top"],
    });
    const bgY = useTransform(scrollYProgress, [0, 1], [0, 70]); // slower background

    return (
        <motion.section
            id="features"
            ref={sectionRef}
            className="py-24 md:py-32 bg-black relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
        >
            {/* subtle parallax background */}
            <motion.div
                style={{ y: bgY }}
                className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-pxi-purple/10 via-transparent to-transparent blur-[80px]"
            />
            <div id="attendees" className="container mx-auto px-6">
                <motion.div
                    className="mb-12 md:mb-20 text-center lg:text-left"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
                        For the{" "}
                        <span className="text-pxi-purple">Party People</span>
                    </h2>

                    <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-medium">
                        Your ticket is the key. Unlock a world where every photo
                        is shared, and every memory is kept.
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.08,
                            },
                        },
                    }}
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            className="group relative glass-dark p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 hover:border-pxi-purple/30 transition-all duration-500 flex flex-col gap-6"
                            variants={{
                                hidden: { opacity: 0, y: 40 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-pxi-purple animate-pulse"></div>
                                    <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                        {feature.tag}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight group-hover:text-pxi-purple transition-colors">
                                    {feature.title}
                                </h3>

                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    {feature.description}
                                </p>

                                <div className="flex gap-2">
                                    <button className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-pxi-purple hover:text-white transition-all">
                                        Explore
                                    </button>
                                    <button className="p-2 glass rounded-xl text-zinc-500 hover:text-pxi-purple transition-colors">
                                        <Heart size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full flex items-center justify-center mt-4 md:mt-0">
                                <motion.div
                                    className="relative w-full max-w-2xs"
                                    style={{
                                        y: useTransform(
                                            scrollYProgress,
                                            [0, 1],
                                            [10, -40]
                                        ),
                                    }}
                                >
                                    <div className="absolute -inset-4 bg-pxi-purple/20 blur-[60px] rounded-full group-hover:bg-pxi-purple/30 transition-all duration-500"></div>

                                    <div className="relative z-10 ">
                                        <div className="bg-black rounded-4xl p-3 shadow-2xl border border-white/10 overflow-hidden">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

                                            <div className=" overflow-hidden bg-black">
                                                <Swiper
                                                    modules={[
                                                        Autoplay,
                                                        Pagination,
                                                    ]}
                                                    spaceBetween={0}
                                                    slidesPerView={1}
                                                    loop={
                                                        feature.images.length >
                                                        1
                                                    }
                                                    autoplay={{
                                                        delay: 4500,
                                                        disableOnInteraction: false,
                                                    }}
                                                    pagination={{
                                                        clickable: true,
                                                        type: "bullets",
                                                    }}
                                                    className="rounded-[2.5rem] overflow-hidden bg-black"
                                                >
                                                    {feature.images.map(
                                                        (src, sidx) => (
                                                            <SwiperSlide
                                                                key={sidx}
                                                            >
                                                                <div className="aspect-[9/19]  overflow-hidden">
                                                                    <img
                                                                        src={
                                                                            src
                                                                        }
                                                                        alt={`${feature.title} ${sidx + 1}`}
                                                                        className="w-full h-full object-cover transition-all duration-700"
                                                                    />
                                                                </div>
                                                            </SwiperSlide>
                                                        ),
                                                    )}
                                                </Swiper>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
};

export default AttendeeFeatures;
