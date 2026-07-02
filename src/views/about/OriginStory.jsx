import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RiLightbulbFlashLine } from "react-icons/ri";
import Badge from "../../components/Badge";
const team2 = "/images/team2.JPG";

gsap.registerPlugin(ScrollTrigger);

const OriginStory = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".origin-section").forEach((el) => {
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
        <section className="origin-section relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="order-2 md:order-1">
                        <div className="glass-card">
                            <div className="flex justify-start">
                                <Badge
                                    icon={RiLightbulbFlashLine}
                                    text="The Idea"
                                />
                            </div>
                            <h2 className="mt-6 text-3xl md:text-4xl font-extrabold leading-tight">
                                <span className="heading-gradient">
                                    Built From Lost Moments -
                                </span>

                                <span className="text-white">
                                    Designed To Keep Them Forever.
                                </span>
                            </h2>

                            <div className="mt-6 space-y-4 text-gray-300 text-base leading-relaxed">
                                <p>
                                    We used to throw incredible parties, nights
                                    full of energy, people, and memories. But
                                    the best photos always vanished into someone
                                    else's camera roll. PXI exists so that never
                                    happens again.
                                </p>

                                <p>
                                    It started with a group of international
                                    friends who loved bringing people together.
                                    We hosted event after event, learning what
                                    makes a night unforgettable… until the
                                    logistics grew louder than the fun, and we
                                    stepped back.
                                </p>

                                <p>
                                    In our own private gatherings, a deeper
                                    frustration appeared: moments were scattered
                                    across dozens of phones. Months later, one
                                    of us would uncover a buried photo, the
                                    perfect angle of you and that rediscovery
                                    felt electric.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 md:order-2 flex justify-center md:justify-end">
                        <div className="w-full max-w-md rounded-xl overflow-hidden shadow-xl">
                            <video
                                src="/landing/assets/movie.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full aspect-square object-cover rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OriginStory;
