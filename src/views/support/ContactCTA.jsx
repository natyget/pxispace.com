'use client';

import { motion } from "framer-motion";
import { FiMail, FiShield } from "react-icons/fi";

const ContactCTA = () => {
    return (
        <section className="px-4 pb-24 lg:pb-32">
            <div className="container mx-auto max-w-3xl">
                <div className="glass-card border-glow p-8 text-center">
                    <h3 className="text-2xl font-extrabold heading-gradient">
                        Still need help?
                    </h3>
                    <p className="mt-2 text-sm text-color-secondary">
                        We typically reply within one to two business days.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <motion.a
                            href="mailto:support@pxispace.com"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 transition-shadow"
                        >
                            <FiMail size={15} />
                            support@pxispace.com
                        </motion.a>

                        <motion.a
                            href="mailto:trust@pxispace.com"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors"
                        >
                            <FiShield size={15} />
                            trust@pxispace.com
                        </motion.a>
                    </div>

                    <p className="mt-5 text-xs text-color-secondary">
                        Use <span className="text-purple-400">trust@pxispace.com</span> for safety, privacy, or community guideline issues.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ContactCTA;
