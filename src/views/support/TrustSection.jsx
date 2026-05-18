import { HugeiconsIcon } from '@hugeicons/react';
'use client';

import { motion } from "framer-motion";
import { FiCpu, FiSmartphone, FiZap } from "react-icons/fi";

const items = [
    {
        icon: FiCpu,
        title: "Perfect Hardware + Software Sync",
        text: "PXIStudio and PXIClip are engineered to work together seamlessly, zero pairing stress, zero setup confusion.",
    },
    {
        icon: FiSmartphone,
        title: "Tested Across All Major Devices",
        text: "From iPhones to Samsung and Pixel, PXIClip works flawlessly across today's most popular devices.",
    },
    {
        icon: FiZap,
        title: "Fast, Reliable Printing",
        text: "PXIClip delivers crisp, consistent prints with smooth thermal output, no fading, no smudging.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12 } }),
};

const TrustSection = () => {
    return (
        <section className="relative px-4 py-20 lg:py-28">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold heading-gradient">
                        Why PXI Works Perfectly
                    </h2>
                    <p className="mt-3 text-color-secondary max-w-2xl mx-auto">
                        This isn't typical troubleshooting, it's reassurance. PXI
                        is built to be dependable.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((it, i) => {
                        const Icon = it.icon;
                        return (
                            <motion.div
                                key={i}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={cardVariants}
                                className="glass-card card-glow p-6 relative overflow-hidden"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-full bg-white/5 border border-purple-500/20 flex items-center justify-center">
                                        <HugeiconsIcon icon={Icon} className="text-purple-300"
                                            size={20}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold heading-gradient text-lg">
                                            {it.title}
                                        </h3>
                                        <p className="mt-2 text-color-secondary text-sm">
                                            {it.text}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default TrustSection;
