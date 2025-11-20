import { motion } from "framer-motion";
import { FiCpu, FiSmartphone, FiPrinter, FiBluetooth } from "react-icons/fi";
import Badge from "../../components/Badge";
import img from "../../assets/about.png";

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
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
};

const PXIClip = () => {
    const clipFeatures = [
        { icon: FiSmartphone, label: "Portable & Compact" },
        { icon: FiPrinter, label: "High-Quality Thermal Printing" },
        { icon: FiBluetooth, label: "One-Tap Pairing with PXIStudio" },
    ];

    return (
        <section className="relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-10" />
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.div
                    className="grid md:grid-cols-2 gap-12 items-center "
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    {/* Left Side */}
                    <motion.div className="space-y-6" variants={fadeInUp}>
                        <Badge icon={FiCpu} text="PXIClip" />

                        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                            <span className="heading-gradient-purple-cyan">
                                Turn Your Phone Into
                            </span>
                            <br />
                            <span className="text-white">
                                a Digital Camera.
                            </span>
                        </h2>

                        <p className="text-base md:text-lg text-color-secondary leading-relaxed">
                            PXIClip bridges digital and physical memories. Snap
                            a photo on PXIStudio and instantly print it directly
                            from your device with rich, vibrant clarity.
                        </p>

                        <div className="space-y-3 pt-4">
                            {clipFeatures.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    className="flex items-center gap-3"
                                    variants={fadeInUp}
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50">
                                        <feature.icon className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <span className="text-gray-300 font-medium">
                                        {feature.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Side - Hardware Mockup */}
                    <motion.div
                        className="flex justify-center md:justify-end"
                        variants={fadeInUp}
                    >
                        <motion.div
                            className="w-full  max-w-sm rounded-4xl  flex items-center justify-center overflow-hidden"
                            animate={{ y: [0, -12, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <img src={img} className="" alt="pxi hardware" />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default PXIClip;
