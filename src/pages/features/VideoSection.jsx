import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import pxiAd from "../../assets/PXIAd.mp4";
import pxiHero from "../../assets/logo.png";

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

const VideoSection = () => {
    const videoRef = useRef(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // muted autoplay to satisfy browser policies
                        el.muted = true;
                        el.playsInline = true;
                        el.play().catch(() => {});
                    } else {
                        el.pause();
                    }
                });
            },
            { threshold: 0.1 }
        );

        obs.observe(el);

        return () => {
            obs.disconnect();
        };
    }, []);

    return (
        <section className="relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                    className="space-y-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    <motion.div
                        className="w-full h-72 sm:h-96 md:h-[500px] border border-purple-500/10 rounded-2xl overflow-hidden"
                        variants={fadeInUp}
                    >
                        <video
                            ref={videoRef}
                            src={pxiAd}
                            className="w-full h-full object-cover"
                            poster={pxiHero}
                            muted
                            loop
                            playsInline
                        />
                    </motion.div>

                    <motion.p
                        className="text-center text-color-secondary"
                        variants={fadeInUp}
                    >
                        PXIClip in action - printing your favorite moments
                        instantly.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
};

export default VideoSection;
