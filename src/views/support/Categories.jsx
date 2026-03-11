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
        desc: "How to use PXIStudio features and workflows.",
    },
    {
        icon: FiPrinter,
        title: "PXIClip Device Guide",
        desc: "Setup, troubleshooting and best printing practices.",
    },
    {
        icon: FiUsers,
        title: "Organizer Tools",
        desc: "Manage events, guests, and albums.",
    },
    {
        icon: FiCreditCard,
        title: "Payments & Billing",
        desc: "Invoices, refunds and subscription info.",
    },
    {
        icon: FiPackage,
        title: "Shipping & Warranty",
        desc: "Shipping timelines and warranty coverage.",
    },
    {
        icon: FiShield,
        title: "Privacy & Security",
        desc: "How we protect your photos and data.",
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
                        return (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className="group text-left glass-card p-5 border border-transparent hover:border-purple-400/30 transition-all duration-200"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-purple-500/20 flex items-center justify-center">
                                            <Icon
                                                className="text-purple-300"
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

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-purple-300">
                                        <FiArrowRight />
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Categories;
