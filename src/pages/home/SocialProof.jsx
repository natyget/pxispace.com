import React from "react";

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
    <div className="group relative cursor-default">
        <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 uppercase transition-colors group-hover:from-pxi-purple group-hover:to-white">
            {tag.name}
        </span>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 bg-gray-900 border border-pxi-purple/30 rounded-xl shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50">
            <p className="text-white text-xs font-bold mb-1">{tag.name}</p>
            <p className="text-gray-400 text-[10px] leading-tight leading-relaxed">
                {tag.desc}
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

const SocialProof = () => {
    const displayTags = [...tagData, ...tagData, ...tagData];
    const mockUsers = Array.from({ length: 8 }).map((_, i) => ({
        name: `User ${i + 1}`,
        avatar: `https://i.pravatar.cc/100?img=${i + 30}`,
    }));

    return (
        <section className="py-12 bg-[#050505] border-t border-gray-900 overflow-hidden">
            <div className="container mx-auto px-6 mb-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                    Join{" "}
                    <span className="text-pxi-purple">10k+ Party People</span>
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
            </div>

            {/* Infinite Scroll Ticker */}
            <div className="relative flex overflow-x-hidden group/ticker">
                <div className="py-12 animate-scroll whitespace-nowrap flex gap-12 group-hover/ticker:[animation-play-state:paused]">
                    {displayTags.map((tag, idx) => (
                        <TagItem key={`set1-${idx}`} tag={tag} idx={idx} />
                    ))}
                </div>

                <div
                    className="absolute py-12 animate-scroll whitespace-nowrap flex gap-12 group-hover/ticker:[animation-play-state:paused]"
                    aria-hidden="true"
                >
                    {displayTags.map((tag, idx) => (
                        <TagItem key={`set2-${idx}`} tag={tag} idx={idx} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
