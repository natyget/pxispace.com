import { motion } from "framer-motion";
import { FiCpu, FiCamera, FiZap, FiUsers } from "react-icons/fi";
import Badge from "../../components/Badge";
import team2 from "../../assets/team2.JPG";

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

const PXIStudio = () => {
    const featuresList = [
        { icon: FiCamera, label: "Smart Capture" },
        { icon: FiZap, label: "Real-Time Sync" },
        { icon: FiUsers, label: "Group Sharing" },
    ];

    return (
        <section className="relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-10" />

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.div
                    className="grid md:grid-cols-2 gap-12 items-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    {/* Left Side */}
                    <motion.div className="space-y-6" variants={fadeInUp}>
                        <Badge icon={FiCpu} text="PXIStudio" />

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                            <span className="heading-gradient">
                                The All-In-One Event
                            </span>
                            <br />
                            <span className="">Memory System.</span>
                        </h2>

                        <p className="text-base md:text-lg text-color-secondary leading-relaxed">
                            PXIStudio is the core of the PXI experience — a
                            unified platform where shared albums, reactions,
                            social feeds, and digital camera tools come together
                            to remove friction and elevate memories.
                        </p>

                        <div className="space-y-3 pt-4">
                            {featuresList.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    className="flex items-center gap-3"
                                    variants={fadeInUp}
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50">
                                        <feature.icon className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className="text-gray-300 font-medium">
                                        {feature.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Side - Floating Glass Panel */}
                    <motion.div
                        className="flex justify-center md:justify-end"
                        variants={fadeInUp}
                    >
                        <motion.div
                            className="w-full max-w-sm rounded-3xl overflow-hidden glass-card-premium glow-border card-glow-neon border border-purple-500/20"
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <img
                                src={team2}
                                alt="PXIStudio"
                                className="w-full h-80 object-cover"
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default PXIStudio;
