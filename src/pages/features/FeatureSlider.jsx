import { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import libraryImg from "../../assets/Library.PNG";
import liveAlbumImg from "../../assets/Live album.PNG";
import postcaptureImg from "../../assets/Postcapture.jpeg";
import profileImg from "../../assets/Profile.PNG";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" },
    },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
};

const FeatureSlider = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    const slides = [
        {
            title: "Live Shared Albums",
            description:
                "See every angle in real time. PXI automatically builds a shared album as guests capture photos — no more chasing images or losing the best shots.",
            image: libraryImg,
        },
        {
            title: "Live Social Feed",
            description:
                "Reactions, comments, and moments flow in live as memories are created. A nostalgic, fun feed that brings energy to every event.",
            image: liveAlbumImg,
        },
        {
            title: "Digital Camera Modes",
            description:
                "Capture the vibe with built-in filters, flash control, and camera modes designed to make real-world moments look cinematic.",
            image: postcaptureImg,
        },
        {
            title: "Profile & Sharing",
            description:
                "Manage your profile, see contributions and access archives quickly with a delightful, easy interface.",
            image: profileImg,
        },
    ];

    return (
        <section className="relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-8" />

            <div className="container mx-auto max-w-3xl relative z-10">
                <motion.div
                    className="grid md:grid-cols-2 gap-8 items-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    {/* LEFT: Phone Mockup with Slider */}
                    <motion.div
                        className="flex justify-center md:justify-start"
                        variants={fadeInUp}
                    >
                        <div className="relative">
                            {/* Phone frame mockup */}
                            <div className="relative w-76 h-160 scale-90 rounded-3xl border-3 border-purple-500/30 shadow-2xl overflow-hidden bg-black glow-border">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

                                {/* Slider inside phone */}
                                <Swiper
                                    modules={[Autoplay, Pagination]}
                                    effect="slide"
                                    autoplay={{
                                        delay: 4000,
                                        disableOnInteraction: false,
                                    }}
                                    pagination={{ clickable: true }}
                                    onSlideChange={(swiper) =>
                                        setActiveSlide(swiper.activeIndex)
                                    }
                                    className="w-full h-full"
                                >
                                    {slides.map((slide, idx) => (
                                        <SwiperSlide key={idx}>
                                            <img
                                                src={slide.image}
                                                alt={slide.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>

                            {/* Floating animation glow */}
                            {/* <div className="absolute -inset-6 bg-linear-to-b from-purple-500/20 to-cyan-500/10 rounded-3xl blur-2xl -z-10 animate-pulse-glow" /> */}
                        </div>
                    </motion.div>

                    {/* RIGHT: Dynamic Text Content */}
                    <motion.div className="space-y-6" variants={fadeInUp}>
                        <motion.div
                            key={activeSlide}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            <h3 className="text-3xl md:text-4xl mt-10 md:mt-0 font-extrabold leading-tight">
                                <span className="heading-gradient-pink-purple">
                                    {slides[activeSlide].title}
                                </span>
                            </h3>

                            <p className="text-base md:text-lg text-color-secondary leading-relaxed">
                                {slides[activeSlide].description}
                            </p>
                        </motion.div>

                        {/* Slide indicators */}
                        <div className="flex gap-3 pt-6">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSlide(idx)}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        idx === activeSlide
                                            ? "w-8 bg-purple-500"
                                            : "w-4 bg-purple-500/30 hover:bg-purple-500/50"
                                    }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureSlider;
