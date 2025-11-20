import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RiCompassDiscoverLine } from "react-icons/ri";
import Badge from "../../components/Badge";

gsap.registerPlugin(ScrollTrigger);

const Mission = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".mission-badge", {
                autoAlpha: 0,
                y: 12,
                duration: 0.6,
                ease: "power3.out",
            });
            gsap.from(".mission-headline", {
                autoAlpha: 0,
                y: 20,
                duration: 0.7,
                delay: 0.1,
                ease: "power3.out",
            });
            gsap.from(".mission-text", {
                autoAlpha: 0,
                y: 18,
                duration: 0.7,
                delay: 0.2,
                ease: "power3.out",
            });

            gsap.utils.toArray(".mission-section").forEach((el) => {
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
        <section className="mission-section relative px-4 py-32 lg:py-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-15" />

            <div className="container mx-auto max-w-3xl relative z-10">
                <div className="text-center space-y-8">
                    <div className="flex justify-center mission-badge">
                        <Badge
                            icon={RiCompassDiscoverLine}
                            text="Our Mission"
                        />
                    </div>

                    <h2 className="mission-headline text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight">
                        Making{" "}
                        <span className="heading-gradient-pink-purple">
                            Every Moment Count
                        </span>
                    </h2>

                    <p className="mission-text text-gray-300 sm:text-lg leading-relaxed max-w-2xl mx-auto">
                        Our mission is simple: to make it easy for people to
                        connect, celebrate, and remember. PXI is designed to
                        remove the stress from organizing and amplify the joy of
                        experiencing something together. Whether digital or
                        physical, every memory deserves to live fully.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Mission;
