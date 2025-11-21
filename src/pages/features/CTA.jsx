import { motion } from "framer-motion";
import { FaApple, FaAndroid } from "react-icons/fa";

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

const CTA = () => {
    return (
        <section className="relative px-4 py-32 lg:py-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-15" />

            <div className="container mx-auto max-w-3xl relative z-10">
                <motion.div
                    className="text-center space-y-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    <motion.h2
                        className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight"
                        variants={fadeInUp}
                    >
                        <span className="heading-gradient-pink-purple">
                            Get the PXI
                        </span>
                        <br />
                        <span className="text-white">Experience.</span>
                    </motion.h2>

                    <motion.p
                        className="text-lg sm:text-xl text-color-secondary"
                        variants={fadeInUp}
                    >
                        Download PXIStudio or join the waitlist for PXIClip.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
                        variants={fadeInUp}
                    >
                        {/* App Store Button */}
                        <button className="px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 glass-card-premium hover-glow-subtle border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 text-white group">
                            <FaApple className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
                            App Store
                        </button>

                        {/* Google Play Button */}
                        <button className="px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 glass-card-premium hover-glow-subtle border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 text-white group">
                            <FaAndroid className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                            Google Play
                        </button>
                    </motion.div>

                    {/* Waitlist Button */}
                    <motion.button
                        className="mx-auto block px-8 py-3 rounded-lg font-semibold text-purple-300 border border-purple-500/50 hover:border-purple-500 hover:text-purple-200 transition-all duration-300 bg-purple-500/5 hover:bg-purple-500/10"
                        variants={fadeInUp}
                    >
                        Join Waitlist - 20% OFF
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;
