import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Inline keyframes for infinite horizontal scroll.
 * This will inject the animation CSS on mount.
 */
const injectScrollAnimation = () => {
    if (document.getElementById('scroll-ticker-animate')) return;
    const style = document.createElement('style');
    style.id = 'scroll-ticker-animate';
    style.innerHTML = `
    @keyframes ticker-scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }
    .infinite-ticker-track {
        display: flex;
        gap: 3rem;
        white-space: nowrap;
        will-change: transform;
        animation: ticker-scroll 35s linear infinite;
        /* Pauses on ticker hover - group-hover via selector */
    }
    .group\\/ticker:hover .infinite-ticker-track {
        animation-play-state: paused;
    }
    `;
    document.head.appendChild(style);
};

const tagData = [
    {
        name: "Weddings",
        desc: "Capture vows, first dance, and candid moments.",
    },
    { name: "Camping Trips", desc: "Campfire stories and starlit memories." },
    { name: "Rooftop Parties", desc: "Sunset cocktails and skyline DJs." },
    {
        name: "Birthdays",
        desc: "Celebrate milestones with friends and surprises.",
    },
    { name: "Concerts", desc: "Live shows, lights, and unforgettable energy." },
    { name: "Hikes", desc: "Trail photos and scenic vistas." },
    {
        name: "Festivals",
        desc: "Multi-stage music and immersive installations.",
    },
    {
        name: "Corporate Events",
        desc: "Professional captures for marketing and recaps.",
    },
];

const TagItem = ({ tag, idx }) => (
    <a
        href={`#${tag.name.replace(/\s+/g, "")}`}
        className="group relative cursor-pointer inline-block"
    >
        <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 uppercase transition-colors group-hover:from-pxi-purple group-hover:to-white">
            #{tag.name}
        </span>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-black/95 border border-white/30 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap">
            <p className="text-pxi-purple text-sm font-black mb-1">
                #{tag.name}
            </p>
            <p className="text-gray-300 text-xs">{tag.desc}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent  border-t-gray-900"></div>
        </div>
    </a>
);

const SocialProof = () => {
    // Only 1 copy is needed per row, since we duplicate in the DOM for seamless loop
    const displayTags = [...tagData, ...tagData];
    const mockUsers = Array.from({ length: 8 }).map((_, i) => ({
        name: `User ${i + 1}`,
        avatar: `https://i.pravatar.cc/100?img=${i + 30}`,
    }));

    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });
    const sectionOpacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0.9]);
    const sectionY = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -10]);
    const headingY = useTransform(scrollYProgress, [0, 1], [20, -10]);
    const tickerY = useTransform(scrollYProgress, [0, 1], [10, -20]); // subtle parallax

    useEffect(() => {
        injectScrollAnimation();
    }, []);

    return (
        <motion.section
            ref={sectionRef}
            className="py-12 bg-[#050505] border-t border-gray-900"
            style={{
                opacity: sectionOpacity,
                y: sectionY,
            }}
        >
            <motion.div
                className="container mx-auto px-6 mb-8 text-center"
                style={{ y: headingY }}
            >
                <h3 className="text-2xl font-bold mb-4">
                    Join <span className="text-pxi-purple"> Party People</span>
                </h3>

                <div className="flex justify-center -space-x-4">
                    {mockUsers.map((u, i) => (
                        <div
                            key={i}
                            className="w-12 h-12 rounded-full border-2 border-[#050505] overflow-hidden"
                            title={u.name}
                        >
                            <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}

                    <div className="w-12 h-12 rounded-full border-2 border-[#050505] bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
                        +9k
                    </div>
                </div>
            </motion.div>

            {/* Infinite Scroll Ticker */}
            <motion.div
                className="relative flex overflow-x-hidden group/ticker pt-8"
                style={{ y: tickerY }}
            >
                {/* The ticker-track is 2x sequence of tags, for infinite illusion */}
                <div
                    className="infinite-ticker-track py-12"
                    style={{ minWidth: "200%" }} // Makes sure both sets of tags fit
                >
                    {[...displayTags, ...displayTags].map((tag, idx) => (
                        <TagItem key={`ticker-${idx}`} tag={tag} idx={idx} />
                    ))}
                </div>
            </motion.div>
        </motion.section>
    );
};

export default SocialProof;
