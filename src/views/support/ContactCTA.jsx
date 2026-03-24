'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { FiMail, FiEdit, FiShield } from "react-icons/fi";

const primaryBtn =
    "font-bold rounded-lg transition-all duration-300 inline-flex items-center justify-center cursor-pointer border px-6 py-3 text-base bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-purple-500 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 gap-2";
const outlineBtn =
    "font-bold rounded-lg transition-all duration-300 inline-flex items-center justify-center cursor-pointer border-2 px-6 py-3 text-base border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 gap-2";

const ContactCTA = () => {
    return (
        <section className="relative px-4 py-20 lg:py-28">
            <div className="absolute inset-0 bg-gradient-radial opacity-6 pointer-events-none" />

            <div className="container mx-auto max-w-3xl">
                <div className="glass-card p-8 text-center border-glow">
                    <h3 className="text-3xl md:text-4xl font-extrabold heading-gradient">
                        Still Need Help?
                    </h3>
                    <p className="mt-3 text-color-secondary">
                        Reach the PXI team for app, event, billing, or hardware questions. For legal and privacy topics, use the Legal hub.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
                        <motion.a
                            href="mailto:support@pxispace.com"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={primaryBtn}
                        >
                            <FiMail /> Email support
                        </motion.a>
                        <motion.a
                            href="mailto:support@pxispace.com?subject=Support%20ticket&body=Please%20describe%20your%20issue%20and%20include%20your%20account%20email%20or%20phone%20if%20relevant."
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={outlineBtn}
                        >
                            <FiEdit /> Open a ticket
                        </motion.a>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link href="/legal#community" className={outlineBtn}>
                                <FiShield /> Trust &amp; safety
                            </Link>
                        </motion.div>
                    </div>
                    <p className="mt-6 text-sm text-color-secondary">
                        <a href="mailto:support@pxispace.com" className="text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline">
                            support@pxispace.com
                        </a>
                        {" · "}
                        <a href="mailto:trust@pxispace.com" className="text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline">
                            trust@pxispace.com
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ContactCTA;
