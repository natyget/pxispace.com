import { motion } from "framer-motion";
const illustration = "/images/illustration1.png";
import Badge from "../../components/Badge";
import { FiLayers } from "react-icons/fi";
import NeonButton from "../../components/NeonButton";
'use client';

import Link from "next/link";

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
            staggerChildren: 0.18,
            delayChildren: 0.2,
        },
    },
};

const Hero = () => {
    return (
        <section className="relative px-4 py-20 mt-16 lg:py-28 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-12" />

            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.div
                    className="grid md:grid-cols-2 gap-10 items-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    <motion.div
                        className="order-2 md:order-1 flex justify-center md:justify-end"
                        variants={fadeInUp}
                    >
                        <img
                            src={illustration}
                            alt="PXI Features"
                            className="w-full max-w-md h-auto"
                        />
                    </motion.div>

                    <motion.div
                        className="space-y-6 order-1 md:order-2 text-center md:text-left"
                        variants={fadeInUp}
                    >
                        <div className="flex justify-center md:justify-start">
                            <Badge icon={FiLayers} text="PXI Features" />
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                            Beautifully capture, share and print{" "}
                            <span className=" heading-gradient ">
                                in real-time.
                            </span>
                        </h1>

                        <p className="text-lg text-color-secondary max-w-xl mx-auto md:mx-0">
                            PXI blends elegant hardware and fast software to
                            make memory sharing effortless. Experience the
                            complete ecosystem for capturing, sharing, and
                            printing memories instantly.
                        </p>

                        <div className="flex items-center gap-4 pt-4 justify-center md:justify-start">
                            <Link href="/join">
                                <NeonButton variant="primary" size="md">
                                    Join Waitlist
                                </NeonButton>
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
