'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
    {
        q: "Does PXIClip work on my phone?",
        a: "PXIClip is compatible with most modern phones, including recent iPhone, Samsung Galaxy, and Google Pixel models. If something will not pair, update the app and Bluetooth OS permissions, then try again.",
    },
    {
        q: "How long does printing take?",
        a: "Thermal prints are ready in seconds under normal conditions. For best results, keep the printer charged and use recommended paper.",
    },
    {
        q: "Why are my photos not showing in the shared album?",
        a: "Check that you are online, have granted camera and photo permissions, and have joined the correct event. Event albums unlock when you are checked in at the venue according to the host settings.",
    },
    {
        q: "Is my data secure?",
        a: "We use modern encryption, session tokens instead of stored passwords where applicable, and strict access controls so event content stays with verified attendees. Read the details in our Privacy Policy on the Legal hub.",
    },
    {
        q: "How does face matching (Find My Shots) work?",
        a: "Optional face matching runs on your device only; raw biometric data is not sent to our servers. You can turn it off anytime in app settings.",
    },
    {
        q: "I am a host or vendor — how do payouts work?",
        a: "Payouts and ticketing run through our payment partners (e.g. Stripe). For account-specific questions, email support@pxispace.com with your event or order details.",
    },
    {
        q: "How do I get help with an order or device?",
        a: "Email support@pxispace.com. For trust and safety issues, you can also reach trust@pxispace.com. We typically respond within one to two business days.",
    },
];

const FAQ = () => {
    const [open, setOpen] = useState(null);

    return (
        <section id="faq" className="px-4 py-20 lg:py-28 scroll-mt-28">
            <div className="container mx-auto max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-extrabold heading-gradient text-center">
                    Frequently Asked Questions
                </h2>
                <p className="text-color-secondary text-center mt-3 mb-8">
                    Quick answers - or reach out if you need more help.
                </p>

                <div className="space-y-3">
                    {faqs.map((f, i) => (
                        <div
                            key={i}
                            className="glass-card p-4 border border-transparent"
                        >
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="text-left">
                                    <h3
                                        className={`font-semibold ${
                                            open === i ? "heading-gradient" : ""
                                        }`}
                                    >
                                        {f.q}
                                    </h3>
                                </div>
                                <motion.div
                                    animate={{ rotate: open === i ? 180 : 0 }}
                                >
                                    <FiChevronDown />
                                </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                                {open === i && (
                                    <motion.div
                                        key="content"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.28 }}
                                        className="mt-3 text-color-secondary overflow-hidden"
                                    >
                                        <p>{f.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
