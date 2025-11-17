import { useEffect } from "react";
import { gsap } from "gsap";
import { FiChevronDown, FiMail, FiMessageCircle, FiBook } from "react-icons/fi";
import { Collapse } from "antd";
import ParticleBackground from "../components/ParticleBackground";

const { Panel } = Collapse;

const Support = () => {
    

    const faqs = [
        {
            question: "How do I connect PXI to my phone?",
            answer: "Simply enable Bluetooth on your phone, open the PXI app, and follow the pairing instructions. The process takes less than 30 seconds.",
        },
        {
            question: "What type of paper does PXI use?",
            answer: "PXI uses ZINK (Zero Ink) photo paper. The paper contains embedded dye crystals that activate when heated, eliminating the need for ink cartridges.",
        },
        {
            question: "How long does the battery last?",
            answer: "On a full charge, PXI can print approximately 50 photos. Charging time is about 90 minutes using the included USB-C cable.",
        },
        {
            question: "Is PXI compatible with my phone?",
            answer: "PXI works with iOS 12+ and Android 8+ devices. It connects via Bluetooth, so any modern smartphone with Bluetooth capability is compatible.",
        },
        {
            question: "How do I clean my PXI printer?",
            answer: "Use a soft, dry cloth to wipe the exterior. For the print head, use the included cleaning card once every 50 prints to maintain optimal print quality.",
        },
        {
            question: "What is your return policy?",
            answer: "We offer a 30-day money-back guarantee. If you're not satisfied with your PXI, return it for a full refund, no questions asked.",
        },
    ];

    return (
        <div className="relative min-h-screen">
            <ParticleBackground />

            <section className="relative py-32 px-4 pt-40">
                <div className="absolute inset-0 bg-gradient-radial" />

                <div className="container mx-auto relative z-10">
                    <h1 className="support-title text-5xl md:text-7xl font-bold text-gradient mb-8 text-center">
                        Support Center
                    </h1>
                    <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-20">
                        We're here to help you get the most out of your PXI
                        printer
                    </p>
                </div>
            </section>

            <section className="relative px-4 pb-24">
                <div className="container mx-auto max-w-4xl">
                    <div className="grid md:grid-cols-3 gap-6 mb-24">
                        <div className="contact-card bg-card border-glow rounded-2xl p-8 card-glow text-center space-y-4">
                            <FiMail className="text-5xl text-primary mx-auto" />
                            <h3 className="text-xl font-bold text-foreground">
                                Email Support
                            </h3>
                            <p className="text-muted-foreground">
                                support@pxi.com
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Response within 24 hours
                            </p>
                        </div>

                        <div className="contact-card bg-card border-glow rounded-2xl p-8 card-glow text-center space-y-4">
                            <FiMessageCircle className="text-5xl text-primary mx-auto" />
                            <h3 className="text-xl font-bold text-foreground">
                                Live Chat
                            </h3>
                            <p className="text-muted-foreground">
                                Chat with us
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Mon-Fri, 9am-6pm EST
                            </p>
                        </div>

                        <div className="contact-card bg-card border-glow rounded-2xl p-8 card-glow text-center space-y-4">
                            <FiBook className="text-5xl text-primary mx-auto" />
                            <h3 className="text-xl font-bold text-foreground">
                                User Manual
                            </h3>
                            <p className="text-muted-foreground">
                                Download PDF
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Complete setup guide
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-4xl font-bold text-center text-neon mb-12">
                            Frequently Asked Questions
                        </h2>

                        <Collapse
                            accordion
                            expandIcon={({ isActive }) => (
                                <FiChevronDown
                                    className={`text-xl text-primary transition-transform duration-300 ${
                                        isActive ? "rotate-180" : ""
                                    }`}
                                />
                            )}
                            className="bg-transparent border-none"
                        >
                            {faqs.map((faq, index) => (
                                <Panel
                                    key={index}
                                    header={
                                        <span className="text-lg font-semibold text-foreground">
                                            {faq.question}
                                        </span>
                                    }
                                    className="bg-card border-glow rounded-xl mb-4 overflow-hidden"
                                    style={{
                                        borderRadius: "1rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <p className="text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </Panel>
                            ))}
                        </Collapse>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Support;
