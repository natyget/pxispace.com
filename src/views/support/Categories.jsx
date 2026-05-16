import { HugeiconsIcon } from '@hugeicons/react';
'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import {
    FiCamera,
    FiPrinter,
    FiUsers,
    FiCreditCard,
    FiPackage,
    FiShield,
    FiArrowRight,
} from "react-icons/fi";

const cats = [
    {
        icon: FiCamera,
        title: "PXIStudio App Guide",
        desc: "Discover events, albums, tickets, and sharing — all in one place.",
        href: "/events",
    },
    {
        icon: FiPrinter,
        title: "PXIClip Device Guide",
        desc: "Setup, pairing, and tips for crisp prints at every event.",
        href: "/support#device",
    },
    {
        icon: FiUsers,
        title: "Organizer Tools",
        desc: "Create public events, manage guests, and run your album like a pro.",
        href: "/events",
    },
    {
        icon: FiCreditCard,
        title: "Payments & Billing",
        desc: "Ticketing, payouts, and billing questions for hosts and vendors.",
        href: "mailto:support@pxispace.com?subject=Payments%20%26%20billing",
    },
    {
        icon: FiPackage,
        title: "Shipping & Warranty",
        desc: "Orders, delivery, and hardware coverage — we will walk you through it.",
        href: "mailto:support@pxispace.com?subject=Shipping%20%26%20warranty",
    },
    {
        icon: FiShield,
        title: "Privacy & Security",
        desc: "How we handle your data, biometrics, and account safety.",
        href: "/legal#privacy",
    },
];

const Categories = () => {
    return (
        <section className="px-4 py-20 lg:py-28">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-extrabold heading-gradient">
                        Knowledge Base Categories
                    </h2>
                    <p className="mt-2 text-color-secondary">
                        Browse our most common guides and resources.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cats.map((c, i) => {
                        const Icon = c.icon;
                        const inner = (
                            <>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-purple-500/20 flex items-center justify-center">
                                            <HugeiconsIcon icon={Icon} className="text-purple-300"
                                                size={18}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold heading-gradient">
                                                {c.title}
                                            </h3>
                                            <p className="mt-1 text-color-secondary text-sm">
                                                {c.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-purple-300 shrink-0">
                                        <FiArrowRight />
                                    </div>
                                </div>
                            </>
                        );
                        const className =
                            "group text-left glass-card p-5 border border-transparent hover:border-purple-400/30 transition-all duration-200 block w-full cursor-pointer";
                        return (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                            >
                                {c.href.startsWith("mailto:") ? (
                                    <a href={c.href} className={className}>
                                        {inner}
                                    </a>
                                ) : (
                                    <Link href={c.href} className={className}>
                                        {inner}
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Categories;
