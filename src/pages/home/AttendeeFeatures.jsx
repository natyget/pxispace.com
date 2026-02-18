import React from "react";
import { Camera, Ticket, UserPlus, Heart } from "lucide-react";

const features = [
  {
    icon: <Ticket className="w-6 h-6 text-pxi-purple" />,
    title: "Live the Nostalgia Now",
    tag: "PUBLIC • 2/10/2026",
    description:
      "Your ticket isn't just entry; it’s your key to the event’s shared camera roll.",
    image: "https://picsum.photos/400/400?random=201",
  },
  {
    icon: <UserPlus className="w-6 h-6 text-blue-400" />,
    title: "Your Social Passport",
    tag: "PRIVATE • 2/12/2026",
    description:
      "Build a profile showcasing the events you’ve lived. It’s your story.",
    image: "https://picsum.photos/400/400?random=202",
  },
  {
    icon: <Camera className="w-6 h-6 text-pink-500" />,
    title: "Effortless Capture",
    tag: "MEMBER ACTIVITY",
    description:
      "Fun filters and in-app camera make snapping and sharing the vibe seamless.",
    image: "https://picsum.photos/400/400?random=203",
  },
];

const AttendeeFeatures = () => {
  return (
    <section id="features" className="py-24 md:py-32 bg-black relative">
      <div id="attendees" className="container mx-auto px-6">
        <div className="mb-12 md:mb-20 text-center lg:text-left">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
            For the <span className="text-pxi-purple">Party People</span>
          </h2>

          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-medium">
            Your ticket is the key. Unlock a world where every photo is shared,
            and every memory is kept.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative glass-dark p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 hover:border-pxi-purple/30 transition-all duration-500 flex flex-col gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-pxi-purple animate-pulse"></div>
                  <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight group-hover:text-pxi-purple transition-colors">
                  {feature.title}
                </h3>

                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>

                <div className="flex gap-2">
                  <button className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-pxi-purple hover:text-white transition-all">
                    Explore
                  </button>

                  <button className="p-2 glass rounded-xl text-zinc-500 hover:text-pxi-purple transition-colors">
                    <Heart size={14} />
                  </button>
                </div>
              </div>

              <div className="w-full aspect-video md:aspect-square lg:aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-white/10">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AttendeeFeatures;
