import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RiCamera3Line } from "react-icons/ri";
import Badge from "../../components/Badge";
const illustration1 = "/images/illustration1.png";

gsap.registerPlugin(ScrollTrigger);

const Hardware = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".hardware-section").forEach((el) => {
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
        <section className="hardware-section relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center text-center md:text-left">
                    {/* Left: Text */}
                    <div className="space-y-8 order-2 md:order-1">
                        <div className="flex md:justify-start justify-center">
                            <Badge icon={RiCamera3Line} text="PXIClip" />
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-5xl font-extrabold leading-tight">
                            <span className="heading-gradient-purple-cyan">
                                From Screen to Print
                            </span>
                            <br />
                            <span className="text-white">in Seconds.</span>
                        </h2>

                        <p className="text-gray-300 md:text-lg leading-relaxed">
                            PXIClip brings your favorite digital moments to life
                            instantly. Attach it to your phone, capture a
                            moment, and print it right away. No syncing, no
                            cables, just a frictionless jump from pixel to
                            paper.
                        </p>
                    </div>

                    {/* Right: Phone mockup image */}
                    <div className="order-1 md:order-2 flex justify-center md:justify-end">
                        <div className="relative">
                            <div className="relative w-full h-80 sm:h-120 rounded-3xl overflow-hidden">
                                <img
                                    src={illustration1}
                                    alt="PXIClip device"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hardware;
