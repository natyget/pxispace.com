import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { LuMapPinHouse } from "react-icons/lu";
import NeonButton from "../../components/NeonButton";
import pxiHero from "../../assets/pxi-hero.png";

const Hero = ({ heroRef }) => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.from(".hero-title", {
                autoAlpha: 0,
                y: 30,
                duration: 0.9,
                ease: "power3.out",
            })
                .from(
                    ".hero-subtitle",
                    { autoAlpha: 0, y: 20, duration: 0.8, ease: "power3.out" },
                    "-=0.6"
                )
                .from(
                    ".hero-buttons",
                    { autoAlpha: 0, y: 16, duration: 0.7, ease: "power3.out" },
                    "-=0.55"
                )
                .from(
                    ".hero-image",
                    {
                        autoAlpha: 0,
                        scale: 0.95,
                        duration: 1,
                        ease: "power3.out",
                    },
                    "-=0.8"
                );
        }, heroRef);

        return () => ctx.revert();
    }, [heroRef]);

    return (
        <section className="relative flex items-center justify-center min-h-screen px-4 pt-32 lg:pt-12 ">
            <div className="max-w-280 relative z-10 mx-auto flex flex-col lg:flex-row items-center justify-center gap-12">
                <div className="space-y-8 text-center lg:text-left w-full lg:w-1/2">
                    <div className="hero-badge inline-block mx-auto ">
                        <div className="px-4 py-2 rounded-full border border-purple-500/50 bg-purple-500/10 backdrop-blur-sm">
                            <span className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                                <LuMapPinHouse size={20} />
                                <span>Every photo finds its home</span>
                            </span>
                        </div>
                    </div>

                    <h1 className="hero-title -mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-[80px] font-extrabold leading-15 md:leading-20">
                        Where's <br />
                        <span className="text-transparent  bg-clip-text bg-linear-to-r from-purple-500 to-cyan-500 md:blockd">
                            {" "}
                            My Photo?
                        </span>
                    </h1>

                    <p className="text-md sm:text-lg  hero-subtitle text-white/70  max-w-3xl mx-auto">
                        Someone captured your perfect moment, but it got lost in
                        chats or a camera roll. With PXI, every photo finds its
                        way home. Share, join the memory, and get your best
                        angle before it fades.
                    </p>

                    <div className="flex flex-wrap gap-4 hero-buttons justify-center lg:justify-start">
                        <NeonButton
                            size="md"
                            className="rounded-lg bg-card border-glow "
                            variant="outline"
                        >
                            Learn More
                        </NeonButton>
                        <NeonButton
                            size="md"
                            className="rounded-lg bg-card border-glow "
                            variant="outline"
                        >
                            Explore Features
                        </NeonButton>
                    </div>
                </div>

                <div className="relative flex justify-center hero-image mt-8 lg:mt-0 overflow-hidden rounded-3xl w-full lg:w-1/2 px-4  ">
                    <img
                        src={pxiHero}
                        alt="PXI Printer"
                        className="w-full h-auto object-cover rounded-3xl drop-shadow-2xl transform transition duration-300  hover:scale-105"
                    />
                </div>
            </div>
        </section>
    );
};

export default Hero;
