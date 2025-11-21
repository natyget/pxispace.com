import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
    {
        q: "Does PXIClip work on my phone?",
        a: "PXIClip is compatible with most modern devices, including iPhone, Samsung, Pixel, and more.",
    },
    {
        q: "How long does printing take?",
        a: "PXIClip produces a clear, full-quality print in seconds using optimized thermal technology.",
    },
    {
        q: "Why aren\u0002t photos appearing in the shared album?",
        a: "Ensure you have internet access and camera permissions enabled. PXIStudio syncs instantly when online.",
    },
    {
        q: "Is my data secure?",
        a: "PXI encrypts data and restricts event photo visibility to verified attendees only.",
    },
    {
        q: "How do I get support for an order or device?",
        a: "You can contact our team anytime through chat, email, or a support ticket.",
    },
];

const FAQ = () => {
    const [open, setOpen] = useState(null);

    return (
        <section className="px-4 py-20 lg:py-28">
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
