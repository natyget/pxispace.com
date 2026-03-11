import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RiUserHeartLine, RiCheckLine } from "react-icons/ri";
import Badge from "../../components/Badge";
const teamImage = "/images/team.jpeg";

gsap.registerPlugin(ScrollTrigger);

const Vision = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".vision-section").forEach((el) => {
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

    const teamValues = [
        { icon: RiCheckLine, label: "Experience Builders", color: "purple" },
        { icon: RiCheckLine, label: "Memory Makers", color: "cyan" },
        { icon: RiCheckLine, label: "Problem Solvers", color: "pink" },
        { icon: RiCheckLine, label: "Story Creators", color: "blue" },
    ];

    const colorBgMap = {
        purple: "bg-purple-500/20 border-purple-500/50",
        cyan: "bg-cyan-500/20 border-cyan-500/50",
        pink: "bg-pink-500/20 border-pink-500/50",
        blue: "bg-blue-500/20 border-blue-500/50",
    };

    const colorTextMap = {
        purple: "text-purple-400",
        cyan: "text-cyan-400",
        pink: "text-pink-400",
        blue: "text-blue-400",
    };

    return (
        <section className="vision-section relative px-4 py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial opacity-8" />

            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="text-center space-y-10">
                    <div className="flex justify-center">
                        <Badge
                            icon={RiUserHeartLine}
                            text="Powered by Talent"
                            variant="subtle"
                        />
                    </div>

                    <h2 className="text-5xl sm:text-6xl md:text-6xl font-extrabold mb-6 leading-tight">
                        People Behind <br />
                        <span className="text-transparent bg-clip-text heading-gradient">
                            the Vision
                        </span>
                    </h2>

                    <p className="max-w-2xl md:text-lg mx-auto text-gray-300">
                        We're a small, mission-driven team, organizers,
                        builders, and storytellers, who started PXI to solve a
                        real problem: keep the joy of live events alive by
                        making memories effortless to capture and share.
                    </p>

                    <div className="mt-10 flex justify-center">
                        <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 hover:shadow-xl hover:border-white/20 transition-all duration-300">
                            <img
                                src={teamImage}
                                alt="PXI team"
                                className="w-full h-80 md:h-112 object-cover hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-6">
                        {teamValues.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div
                                    className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                                        colorBgMap[item.color]
                                    }`}
                                >
                                    <item.icon
                                        className={`w-4 h-4 ${
                                            colorTextMap[item.color]
                                        }`}
                                    />
                                </div>
                                <span className="text-gray-300 font-medium">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Vision;
