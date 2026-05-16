import { HugeiconsIcon } from '@hugeicons/react';
'use client';

import { motion } from "framer-motion";
import { FiCheckCircle, FiBluetooth, FiSun } from "react-icons/fi";

const points = [
    { icon: FiCheckCircle, title: "Thousands of print cycles tested" },
    { icon: FiBluetooth, title: "Instant pairing every time" },
    { icon: FiSun, title: "Designed for all lighting conditions" },
];

const DeviceConfidence = () => {
    return (
        <section className="px-4 py-20 lg:py-28">
            <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-purple-500/20 text-sm mb-4">
                        <FiCheckCircle className="text-purple-300 mr-2" />
                        <span className="text-sm font-semibold text-purple-300">
                            Device Confidence
                        </span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-extrabold heading-gradient">
                        Built for Real Moments. Tested for Real Life.
                    </h3>

                    <p className="mt-4 text-color-secondary max-w-lg">
                        PXIClip and PXIStudio are engineered to perform reliably
                        in real event environments - bright venues, dark rooms,
                        fast motion, and more.
                    </p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {points.map((p, i) => {
                            const Icon = p.icon;
                            return (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                    className="group rounded-xl border border-purple-500/20 hover:border-purple-500/40 bg-white/2 hover:bg-purple-500/5 p-4 flex items-center gap-3 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center transition-all duration-300">
                                        <HugeiconsIcon icon={Icon} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                                    </div>
                                    <div className="text-sm text-color-secondary group-hover:text-white transition-colors duration-300">
                                        {p.title}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-center md:justify-end">
                    <div
                        className="w-full max-w-sm min-h-64 glass-card glow-border card-glow-neon rounded-2xl overflow-hidden border border-purple-500/20"
                    >
                        <div className="w-full h-full min-h-64 flex flex-col items-center justify-center gap-4 p-8 text-center bg-gradient-to-br from-purple-950/40 to-black">
                            <FiBluetooth className="text-purple-300 w-14 h-14" />
                            <p className="text-sm text-color-secondary max-w-xs">
                                PXIClip pairs over Bluetooth and is tuned for busy venues — low light, quick shots, and back-to-back prints.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DeviceConfidence;
