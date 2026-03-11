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
        <section className="relative px-4 py-28 lg:py-36 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-20" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-radial opacity-6" />

            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center"
                >
                    <div className="flex justify-center mb-6">
                        <Badge icon={FiHelpCircle} text="Support Center" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight heading-gradient">
                        We're Here to Help
                    </h1>

                    <p className="mt-6 text-color-secondary max-w-2xl mx-auto">
                        Find answers, get guidance, and learn how to get the
                        best experience from PXIStudio and PXIClip.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default SupportHero;
