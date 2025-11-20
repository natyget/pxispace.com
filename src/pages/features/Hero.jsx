import { motion } from "framer-motion";
import { FiLayers } from "react-icons/fi";
import Badge from "../../components/Badge";

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

const Hero = () => {
    return (
        <section className="relative px-4 py-32 lg:py-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-20" />

            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                    className="text-center space-y-8"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div
                        className="flex justify-center"
                        variants={fadeInUp}
                    >
                        <Badge icon={FiLayers} text="PXI Features" />
                    </motion.div>

                    <motion.h1
                        className="hero-title text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight"
                        variants={fadeInUp}
                    >
                        Everything You Need to{" "}
                        <span className="heading-gradient">
                            Capture, Share & Print.
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-lg sm:text-xl text-color-secondary leading-relaxed max-w-2xl mx-auto"
                        variants={fadeInUp}
                    >
                        PXI combines powerful software with a seamless physical
                        device to create a complete memory ecosystem, from
                        capturing moments to reliving them instantly.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
