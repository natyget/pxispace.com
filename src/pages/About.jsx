import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    RiUserHeartLine,
    RiLightbulbFlashLine,
    RiErrorWarningLine,
    RiGroupLine,
    RiCamera3Line,
    RiCompassDiscoverLine,
} from "react-icons/ri";
import Badge from "../components/Badge";
import ParticleBackground from "../components/ParticleBackground";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const sectionRefs = useRef({});

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero section animations
            gsap.from(".about-badge", {
                autoAlpha: 0,
                y: 12,
                duration: 0.6,
                ease: "power3.out",
            });
            gsap.from(".about-hero-headline", {
                autoAlpha: 0,
                y: 20,
                duration: 0.7,
                delay: 0.1,
                ease: "power3.out",
            });
            gsap.from(".about-hero-text", {
                autoAlpha: 0,
                y: 18,
                duration: 0.7,
                delay: 0.2,
                ease: "power3.out",
            });

            // Section animations on scroll
            gsap.utils.toArray(".about-section").forEach((el) => {
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
        <div className="relative min-h-screen">
            <ParticleBackground />

            {/* ====== SECTION 1: HERO INTRO ====== */}
            <section className="relative px-4 py-32 lg:py-40 overflow-hidden">
                {/* Subtle radial glow backdrop */}
                <div className="absolute inset-0 bg-gradient-radial opacity-20" />

                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="text-center space-y-8">
                        <div className="about-badge flex justify-center">
                            <Badge icon={RiUserHeartLine} text="About PXI" />
                        </div>

                     
                         <h1 className="hero-title -mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-[80px] font-extrabold leading-15 md:leading-20">
                        Built to 
                        <span className="text-transparent  bg-clip-text bg-linear-to-r from-purple-500 to-cyan-500 md:blockd">
                            {" "}
                            Bring People Together 
                        </span>
                    </h1>

                        <p className="about-hero-text text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
                            PXI was created to solve a simple problem: the
                            moments that make an event unforgettable shouldn't
                            get lost in someone else's camera roll. We built PXI
                            to unify the entire experience-planning, capturing,
                            and reliving-into one seamless place.
                        </p>
                    </div>
                </div>
            </section>

                {/* ====== SECTION 2: HOW PXI WAS BORN (ORIGIN STORY) ====== */}
            <section className="about-section relative px-4 py-24 lg:py-32 overflow-hidden">

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid md:grid-cols-2 gap-10 items-start">
                        <div className="order-2 md:order-1">
                            <div className="glass-card">
                                <div className="flex justify-start">
                                    <Badge
                                        icon={RiLightbulbFlashLine}
                                        text="The Idea"
                                    />
                                </div>
                                <h2 className="mt-6 text-3xl md:text-4xl font-extrabold leading-tight">
                                    <span className="heading-gradient-purple-cyan">
                                        Built From Lost Moments.
                                    </span>
                                    <br />
                                    <span className="text-white">
                                        Designed To Keep Them Forever.
                                    </span>
                                </h2>

                                <div className="mt-6 space-y-4 text-gray-300 text-base leading-relaxed">
                                    <p>
                                        We used to throw incredible parties,
                                        nights full of energy, people, and
                                        memories. But the best photos always
                                        vanished into someone else's camera
                                        roll. PXI exists so that never happens
                                        again.
                                    </p>

                                    <p>
                                        It started with a group of international
                                        friends who loved bringing people
                                        together. We hosted event after event,
                                        learning what makes a night
                                        unforgettable… until the logistics grew
                                        louder than the fun, and we stepped
                                        back.
                                    </p>

                                    <p>
                                        In our own private gatherings, a deeper
                                        frustration appeared: moments were
                                        scattered across dozens of phones.
                                        Months later, one of us would uncover a
                                        buried photo, the perfect angle of you
                                         and that rediscovery felt electric.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 md:order-2 flex justify-center md:justify-end">
                            <div className="w-full max-w-md rounded-xl overflow-hidden shadow-xl">
                                <img
                                    src="/src/assets/tech-innovation.jpg"
                                    alt="origin story"
                                    className="w-full h-80 object-cover rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                <div className="absolute inset-0 bg-gradient-radial opacity-70" />
                </div>
            </section>

            {/* ====== SECTION 4: THE PEOPLE BEHIND THE VISION ====== */}
            <section className="about-section relative px-4 py-24 lg:py-32 overflow-hidden">
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

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
                            <span className="heading-gradient-pink-purple">
                                The People Behind the Vision
                            </span>
                        </h2>

                        <p className="max-w-2xl mx-auto text-gray-300">
                            We’re a small, mission-driven team — organizers,
                            builders, and storytellers — who started PXI to
                            solve a real problem: keep the joy of live events
                            alive by making memories effortless to capture and
                            share.
                        </p>

                        <div className="mt-6 flex justify-center">
                            <div className="relative rounded-3xl p-1 bg-gradient-to-r from-pink-500/25 via-purple-500/20 to-cyan-500/15 shadow-xl">
                                <div className="overflow-hidden rounded-2xl bg-black border border-purple-500/20 glass-card-premium">
                                    <img
                                        src="/src/assets/team.jpeg"
                                        alt="PXI team"
                                        className="w-full h-96 object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Badge
                                variant="default"
                                icon={RiLightbulbFlashLine}
                                text="Experience Builders"
                            />
                            <Badge
                                variant="default"
                                icon={RiCamera3Line}
                                text="Memory Makers"
                            />
                            <Badge
                                variant="default"
                                icon={RiErrorWarningLine}
                                text="Problem Solvers"
                            />
                            <Badge
                                variant="default"
                                icon={RiCompassDiscoverLine}
                                text="Story Creators"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== SECTION 6: OUR MISSION ====== */}
            <section className="about-section relative px-4 py-32 lg:py-40 overflow-hidden">
                {/* Centered radial glow */}
                <div className="absolute inset-0 bg-gradient-radial opacity-15" />

                <div className="container mx-auto max-w-3xl relative z-10">
                    <div className="text-center space-y-8">
                        <div className="flex justify-center">
                            <Badge
                                icon={RiCompassDiscoverLine}
                                text="Our Mission"
                            />
                        </div>

                        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight">
                            <span className="heading-gradient-pink-purple">
                                Making Every Moment
                            </span>
                            <br />
                            <span className="text-white">Count.</span>
                        </h2>

                        <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
                            Our mission is simple: to make it easy for people to
                            connect, celebrate, and remember. PXI is designed to
                            remove the stress from organizing and amplify the
                            joy of experiencing something together. Whether
                            digital or physical, every memory deserves to live
                            fully.
                        </p>
                    </div>
                </div>
            </section>

        

            {/* ====== SECTION 3: WHAT PXI SOLVES ====== */}
            <section className="about-section relative px-4 py-24 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial opacity-10" />
                {/* Soft glow shape on the right (subtle) */}
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />

                <div className="container mx-auto max-w-6xl relative z-10">
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
                                    Events Should Be Fun
                                </span>
                                <br />
                                <span className="text-white">— Not Work.</span>
                            </h3>

                            <p className="mt-4 text-gray-300 text-lg leading-relaxed max-w-xl">
                                Organizers juggle ticketing apps, chats,
                                spreadsheets, and constant reminders just to
                                keep an event alive. Attendees capture amazing
                                moments but lose them across scattered camera
                                rolls. PXI removes all that friction and gives
                                everyone one shared place to live the experience
                                together.
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
                                        <li>
                                            Organizers juggling multiple tools
                                        </li>
                                    </ul>
                                </div>

                                <div className="glass-card">
                                    <h4 className="text-sm font-semibold text-cyan-300">
                                        Solution
                                    </h4>
                                    <ul className="mt-2 text-gray-400 text-sm space-y-2">
                                        <li>One shared, live camera roll</li>
                                        <li>
                                            Automatic collection and simple
                                            sharing
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center md:justify-end">
                            <div className="w-full max-w-md">
                                <img
                                    src="/src/assets/product-accessories.jpg"
                                    alt="problem"
                                    className="w-full h-80 object-cover rounded-xl shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            

            {/* ====== SECTION 5: THE PHYSICAL BRIDGE (PXIClip) ====== */}
            <section className="about-section relative px-4 py-24 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial opacity-10" />
                {/* Neon highlight glow behind the right side */}
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
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

                            <p className="text-gray-300 text-lg leading-relaxed">
                                PXIClip brings your favorite digital moments to
                                life instantly. Attach it to your phone, capture
                                a moment, and print it right away. No syncing,
                                no cables — just a frictionless jump from pixel
                                to paper.
                            </p>
                        </div>

                        {/* Right: Phone mockup image */}
                        <div className="order-1 md:order-2 flex justify-center md:justify-end">
                            <div className="relative">
                                {/* Glow backdrop */}
                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-purple-500/10 blur-3xl rounded-3xl" />
                                <div className="relative w-64 h-80 rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden bg-black">
                                    <img
                                        src="/src/assets/camera.png"
                                        alt="PXIClip device"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            
        </div>
    );
};

export default About;
