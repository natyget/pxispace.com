import { motion } from "framer-motion";
import { FiMessageCircle, FiMail, FiEdit } from "react-icons/fi";
import NeonButton from "../../components/NeonButton";

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
                        Our team is ready to assist you with anything related to
                        PXIStudio or PXIClip.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <NeonButton
                            variant="primary"
                            size="md"
                            className="inline-flex items-center gap-2"
                        >
                            <FiMessageCircle /> Chat With Support
                        </NeonButton>
                        <NeonButton
                            variant="outline"
                            size="md"
                            className="inline-flex items-center gap-2"
                        >
                            <FiMail /> Email Us
                        </NeonButton>
                        <NeonButton
                            variant="outline"
                            size="md"
                            className="inline-flex items-center gap-2"
                        >
                            <FiEdit /> Open a Ticket
                        </NeonButton>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactCTA;
