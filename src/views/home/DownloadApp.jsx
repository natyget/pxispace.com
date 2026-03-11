import { MdDownload } from "react-icons/md";
import { FaApple, FaGooglePlay } from "react-icons/fa";
const cameraImg = "/images/camera.PNG";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DownloadApp = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".download-badge", {
                autoAlpha: 0,
                y: 10,
                duration: 0.5,
                ease: "power3.out",
            });
            gsap.from(".download-left", {
                autoAlpha: 0,
                x: -18,
                duration: 0.7,
                ease: "power3.out",
                scrollTrigger: { trigger: ".download-left", start: "top 90%" },
            });
            gsap.from(".download-mockup", {
                autoAlpha: 0,
                y: 22,
                scale: 0.98,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".download-mockup",
                    start: "top 88%",
                },
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative px-6 py-24">
            <div className="mx-auto max-w-6xl">
                <div className="grid md:grid-cols-2 place-items-center gap-6 ">
                    {/* Left: Text content */}
                    <div className="download-left w-full text-center md:text-left md:order-2">
                        <div className="download-badge inline-flex items-center gap-2 px-4 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 backdrop-blur-sm mb-4">
                            <MdDownload className="text-purple-400" size={18} />
                            <span className="text-sm font-semibold text-purple-400">
                                Get the App
                            </span>
                        </div>

                        <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-cyan-500">
                            Experience PXI Anywhere
                        </h3>

                        <p className="text-gray-400 mt-4 leading-relaxed max-w-md  mx-auto md:mx-0">
                            PXI gives you a smooth, powerful experience whether
                            you're hosting an event or joining one. Capture
                            moments, stay connected, and relive the best
                            memories, all from one app.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-4 md:justify-start justify-center">
                            <a
                                href="#"
                                className="flex items-center gap-3 px-6 h-12 rounded-4xl border border-purple-500/20 bg-transparent text-white transition-shadow duration-200 shadow-none hover:shadow-[0_0_30px_rgba(139,92,246,0.45)] border-glow"
                            >
                                <FaApple className="text-xl" />
                                <span className="text-sm font-semibold">
                                    Apple Store
                                </span>
                            </a>

                            <a
                                href="#"
                                className="flex items-center gap-3 px-6 h-12 rounded-4xl border border-purple-500/20 bg-transparent text-white transition-shadow duration-200 shadow-none hover:shadow-[0_0_30px_rgba(139,92,246,0.45)] border-glow"
                            >
                                <FaGooglePlay className="text-xl" />
                                <span className="text-sm font-semibold">
                                    Google Play
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Right: Phone mockup */}
                    <div className="w-full flex items-center justify-center md:order-1">
                        <div className="download-mockup w-full max-w-[360px] aspect-9/15 rounded-3xl border border-white/10 shadow-[0_0_25px_-10px_rgba(139,92,246,0.5)] overflow-hidden bg-black">
                            <img
                                src={cameraImg}
                                alt="PXI app mockup"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DownloadApp;
