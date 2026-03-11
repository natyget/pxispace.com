import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RiErrorWarningLine } from "react-icons/ri";
import Badge from "../../components/Badge";
const productAccessories = "/images/product-accessories.jpg";

gsap.registerPlugin(ScrollTrigger);

const Problem = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".problem-section").forEach((el) => {
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                    autoAlpha: 0,
                    y: 24,
                    duration: 0.7,
                    ease: "power3.out",
                });
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <section className="problem-section relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-10" />
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />

            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="flex">
                            <Badge
                                icon={RiErrorWarningLine}
                                text="The Problem"
                            />
                        </div>

                        <h3 className="mt-6 text-3xl md:text-4xl font-extrabold leading-tight">
                            <span className="heading-gradient-pink-cyan">
                                Events Should Be Fun{" "}
                            </span>

                            <span className="text-white">- Not Work.</span>
                        </h3>

                        <p className="mt-4 text-gray-300 md:text-lg leading-relaxed max-w-xl">
                            Organizers juggle ticketing apps, chats,
                            spreadsheets, and constant reminders just to keep an
                            event alive. Attendees capture amazing moments but
                            lose them across scattered camera rolls. PXI removes
                            all that friction and gives everyone one shared
                            place to live the experience together.
                        </p>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="glass-card">
                                <h4 className="text-sm font-semibold text-purple-300">
                                    Pain
                                </h4>
                                <ul className="mt-2 text-gray-400 text-sm space-y-2">
                                    <li>
                                        Scattered photos across dozens of
                                        devices
                                    </li>
                                    <li>Organizers juggling multiple tools</li>
                                </ul>
                            </div>

                            <div className="glass-card">
                                <h4 className="text-sm font-semibold text-cyan-300">
                                    Solution
                                </h4>
                                <ul className="mt-2 text-gray-400 text-sm space-y-2">
                                    <li>One shared, live camera roll</li>
                                    <li>
                                        Automatic collection and simple sharing
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end">
                        <div className="w-full max-w-md">
                            <img
                                src={productAccessories}
                                alt="problem"
                                className="w-full h-80 object-cover rounded-xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Problem;
