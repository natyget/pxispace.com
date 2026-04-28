'use client';

import { motion } from "framer-motion";
import { FiHelpCircle } from "react-icons/fi";
import Badge from "../../components/Badge";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" },
    },
};

const SupportHero = () => {
    return (
        <section className="relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-20" />

            <div className="container mx-auto max-w-3xl relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center"
                >
                    <div className="flex justify-center mb-6">
                        <Badge icon={FiHelpCircle} text="Support" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight heading-gradient">
                        How can we help?
                    </h1>

                    <p className="mt-5 text-color-secondary max-w-xl mx-auto">
                        Browse the most common questions below, or email us directly at{" "}
                        <a
                            href="mailto:support@pxispace.com"
                            className="text-purple-400 hover:text-purple-300 hover:underline underline-offset-2"
                        >
                            support@pxispace.com
                        </a>
                        .
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default SupportHero;
