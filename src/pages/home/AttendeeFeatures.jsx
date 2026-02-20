import React, { useRef, useState } from "react";
import {
    Camera,
    Ticket,
    UserPlus,
    Heart,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import EventPNG from "../../assets/event.PNG";
import AlbumThreadPNG from "../../assets/album_thread.PNG";
import PassportPNG from "../../assets/passport.png";
import CameraPNG from "../../assets/camera.PNG";
import VaultPNG from "../../assets/vault.PNG";

const features = [
    {
        icon: <Ticket className="w-6 h-6 text-pxi-purple" />,
        title: "Live the Nostalgia Now",
        tag: "PUBLIC • 2/10/2026",
        description:
            "Your ticket isn't just entry; it’s your key to the event’s shared camera roll.",
        images: [EventPNG, AlbumThreadPNG],
    },
    {
        icon: <UserPlus className="w-6 h-6 text-blue-400" />,
        title: "Your Social Passport",
        tag: "PRIVATE • 2/12/2026",
        description: "Build a profile showcasing your stamps. It's your story.",
        images: [PassportPNG],
    },
    {
        icon: <Camera className="w-6 h-6 text-pink-500" />,
        title: "Effortless Capture",
        tag: "PUBLIC",
        description:
            "Fun filters and in-app camera make snapping and sharing the vibe seamless.",
        images: [CameraPNG, VaultPNG],
    },
];

const AttendeeFeatures = () => {
    const swiperRef = useRef(null);
    const [isAutoplay, setIsAutoplay] = useState(true);

    const handleMouseEnter = () => {
        if (swiperRef.current?.swiper?.autoplay) {
            swiperRef.current.swiper.autoplay.stop();
            setIsAutoplay(false);
        }
    };

    const handleMouseLeave = () => {
        if (swiperRef.current?.swiper?.autoplay) {
            swiperRef.current.swiper.autoplay.start();
            setIsAutoplay(true);
        }
    };
    return (
        <section id="features" className="py-24 md:py-32 bg-black relative">
            <div id="attendees" className="container mx-auto px-6">
                <div className="mb-12 md:mb-20 text-center lg:text-left">
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
                        For the{" "}
                        <span className="text-pxi-purple">Party People</span>
                    </h2>

                    <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-medium">
                        Your ticket is the key. Unlock a world where every photo
                        is shared, and every memory is kept.
                    </p>
                </div>

                <Swiper
                    ref={swiperRef}
                    modules={[Navigation, Pagination, Autoplay]}
                    navigation={{
                        nextEl: ".swiper-btn-next",
                        prevEl: ".swiper-btn-prev",
                    }}
                    pagination={{
                        clickable: true,
                        dynamicBullets: true,
                        dynamicMainBullets: 3,
                    }}
                    autoplay={{
                        delay: 5000,
                        disableOnInteraction: false,
                    }}
                    loop
                    spaceBetween={32}
                    slidesPerView={1}
                    className="w-full md:scale-90"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {features.map((feature, idx) => (
                        <SwiperSlide key={idx}>
                            <div className="group relative glass-dark p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 hover:border-pxi-purple/30 transition-all duration-500 flex flex-col md:flex-row items-stretch gap-12 min-h-[500px] md:min-h-[450px]">
                                {/* Content Section */}
                                <div className="flex-1 flex flex-col justify-center py-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-pxi-purple animate-pulse"></div>
                                        <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                            {feature.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight group-hover:text-pxi-purple transition-colors leading-tight">
                                        {feature.title}
                                    </h3>

                                    <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-10">
                                        {feature.description}
                                    </p>

                                    <div className="flex gap-3 mt-auto">
                                        <button className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase rounded-xl hover:bg-pxi-purple hover:text-white transition-all duration-300">
                                            Explore
                                        </button>

                                        <button className="p-3 glass rounded-xl text-zinc-500 hover:text-pxi-purple hover:border-pxi-purple/50 border border-white/20 transition-all duration-300">
                                            <Heart size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Phone Mockup Image Carousel */}
                                <div className="w-full md:w-80 flex-shrink-0 flex items-center justify-center">
                                    <div className="relative w-72 md:w-80">
                                        {/* Glow effect */}
                                        <div className="absolute -inset-4 bg-pxi-purple/20 blur-[60px] rounded-full group-hover:bg-pxi-purple/30 transition-all duration-500"></div>

                                        {/* Phone mockup shell */}
                                        <div className="relative z-10">
                                            <div className="bg-black rounded-[3xl] p-3 shadow-2xl border border-white/10">
                                                {/* Notch */}
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

                                                {/* Screen */}
                                                <Swiper
                                                    spaceBetween={0}
                                                    slidesPerView={1}
                                                    pagination={{
                                                        clickable: true,
                                                        type: "bullets",
                                                    }}
                                                    modules={[
                                                        Pagination,
                                                        Autoplay,
                                                    ]}
                                                    autoplay={{
                                                        delay: 4000,
                                                        disableOnInteraction: false,
                                                    }}
                                                    loop={
                                                        feature.images.length >
                                                        1
                                                    }
                                                    className="rounded-[2.5rem] overflow-hidden bg-black"
                                                >
                                                    {feature.images.map(
                                                        (img, imgIdx) => (
                                                            <SwiperSlide
                                                                key={imgIdx}
                                                            >
                                                                <div className="aspect-[9/19] rounded-[2.5rem] overflow-hidden">
                                                                    <img
                                                                        src={
                                                                            img
                                                                        }
                                                                        alt={`${feature.title} ${imgIdx + 1}`}
                                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                                    />
                                                                </div>
                                                            </SwiperSlide>
                                                        ),
                                                    )}
                                                </Swiper>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Custom Navigation Buttons */}
                <div className="flex items-center justify-center gap-6 mt-12">
                    <button className="swiper-btn-prev group relative p-3 glass rounded-full border border-white/20 text-white hover:border-pxi-purple/60 hover:bg-pxi-purple/10 transition-all duration-300">
                        <ChevronLeft
                            size={24}
                            className="group-hover:text-pxi-purple transition-colors"
                        />
                    </button>
                    <button className="swiper-btn-next group relative p-3 glass rounded-full border border-white/20 text-white hover:border-pxi-purple/60 hover:bg-pxi-purple/10 transition-all duration-300">
                        <ChevronRight
                            size={24}
                            className="group-hover:text-pxi-purple transition-colors"
                        />
                    </button>
                </div>
            </div>

            {/* Custom styles for pagination */}
            <style>{`
        .swiper.w-full :global(.swiper-pagination) {
          position: relative;
          bottom: 0;
          margin-top: 24px;
        }
        
        .swiper.w-full :global(.swiper-pagination-bullet) {
          background: rgba(255, 255, 255, 0.3);
          opacity: 1;
          height: 8px;
          width: 8px;
          border-radius: 50%;
          margin: 0 6px;
          transition: all 300ms ease;
        }
        
        .swiper.w-full :global(.swiper-pagination-bullet-active) {
          background: rgb(168, 85, 247);
          width: 24px;
          border-radius: 4px;
        }
      `}</style>
        </section>
    );
};

export default AttendeeFeatures;
