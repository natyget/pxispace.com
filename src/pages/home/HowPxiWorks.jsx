import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiCamera, FiUsers, FiInbox, FiHeart } from "react-icons/fi";
import { RiCameraLensFill } from "react-icons/ri";

gsap.registerPlugin(ScrollTrigger);

const HowPxiWorks = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".how-badge", {
                autoAlpha: 0,
                y: 12,
                duration: 0.6,
                ease: "power3.out",
            });
            gsap.from(".how-title", {
                autoAlpha: 0,
                y: 18,
                duration: 0.7,
                delay: 0.08,
                ease: "power3.out",
            });

            gsap.utils.toArray(".how-card").forEach((el, i) => {
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                        toggleActions: "play none none reverse",
                    },
                    autoAlpha: 0,
                    y: 28,
                    duration: 0.6,
                    delay: i * 0.06,
                    ease: "power3.out",
                });
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);
    return (
        <section ref={sectionRef} className="relative px-4 py-24 lg:py-32">
            <div className="container mx-auto max-w-7xl">
                {/* Badge */}
                <div className="flex justify-center mb-12">
                    <div className="how-badge inline-flex items-center gap-2 border border-purple-500/40 bg-purple-500/10 backdrop-blur-sm rounded-full px-4 py-2 hover:border-purple-500/60 transition-colors duration-300">
                        <FiCamera className="text-purple-400" size={18} />
                        <span className="text-sm font-semibold text-purple-300">
                            Capture. Share. Relive. Together.
                        </span>
                    </div>
                </div>

                {/* Section Title & Description */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="how-title text-5xl sm:text-6xl md:text-6xl  font-extrabold mb-6 leading-tight">
                        How{" "}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-cyan-500">
                            PXI
                        </span>{" "}
                        Works
                    </h2>
                    <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                        PXI brings people together by turning every party,
                        hangout, or celebration into a shared memory hub.
                        <br />
                        No more hunting for photos. No more scattered chats.
                        <br />
                        Everything syncs beautifully, captured in the moment,
                        relived forever.
                    </p>
                </div>

                {/* Four Neon Cards */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1 */}
                    <div className="how-card group p-8 rounded-2xl bg-card/40 border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-sm card-glow-neon">
                        <div className="mb-6 inline-block p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                            <FiUsers className="text-4xl text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                            Create a Shared Space
                        </h3>
                        <p className="text-white/70 mb-6">
                            Set up your event hub in seconds and invite your
                            people.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            Simple • Instant • Shared
                        </a>
                    </div>

                    {/* Card 2 */}
                    <div className="how-card group p-8 rounded-2xl bg-card/40 border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-sm card-glow-neon">
                        <div className="mb-6 inline-block p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                            <RiCameraLensFill className="text-4xl text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                            Capture Moments Together
                        </h3>
                        <p className="text-white/70 mb-6">
                            Guests upload photos, react, and share perspectives
                            instantly.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            Simple • Instant • Shared
                        </a>
                    </div>

                    {/* Card 3 */}
                    <div className="how-card group p-8 rounded-2xl bg-card/40 border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-sm card-glow-neon">
                        <div className="mb-6 inline-block p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                            <FiInbox className="text-4xl text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                            Automatic Memory Collection
                        </h3>
                        <p className="text-white/70 mb-6">
                            PXI gathers every photo, angle, and reaction — all
                            in one place.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            Simple • Instant • Shared
                        </a>
                    </div>

                    {/* Card 4 */}
                    <div className="how-card group p-8 rounded-2xl bg-card/40 border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-sm card-glow-neon">
                        <div className="mb-6 inline-block p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                            <FiHeart className="text-4xl text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                            Relive The Experience
                        </h3>
                        <p className="text-white/70 mb-6">
                            Revisit every moment long after the event ends.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            Simple • Instant • Shared
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowPxiWorks;
