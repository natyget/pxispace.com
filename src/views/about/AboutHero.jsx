import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RiUserHeartLine } from "react-icons/ri";
import Badge from "../../components/Badge";

gsap.registerPlugin(ScrollTrigger);

const AboutHero = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".hero-badge", {
                autoAlpha: 0,
                y: 12,
                duration: 0.6,
                ease: "power3.out",
            });
            gsap.from(".hero-headline", {
                autoAlpha: 0,
                y: 20,
                duration: 0.7,
                delay: 0.1,
                ease: "power3.out",
            });
            gsap.from(".hero-text", {
                autoAlpha: 0,
                y: 18,
                duration: 0.7,
                delay: 0.2,
                ease: "power3.out",
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <section className="relative px-4 py-32 lg:py-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-20" />

            <div className="container mx-auto max-w-4xl relative z-10">
                <div className="text-center space-y-8">
                    <div className="hero-badge flex justify-center">
                        <Badge icon={RiUserHeartLine} text="About PXI" />
                    </div>

                    <h1 className="hero-title hero-headline -mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-extrabold leading-tight md:leading-20">
                        Built to
                        <span className="text-transparent bg-clip-text bg-linear-to-r heading-gradient">
                            {" "}
                            Bring People Together
                        </span>
                    </h1>

                    <p className="hero-text sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
                        PXI was created to solve a simple problem: the moments
                        that make an event unforgettable shouldn't get lost in
                        someone else's camera roll. We built PXI to unify the
                        entire experience-planning, capturing, and reliving-into
                        one seamless place.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default AboutHero;
