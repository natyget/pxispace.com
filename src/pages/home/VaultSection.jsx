import React from "react";
import { Camera, Users } from "lucide-react";

const albums = [
    {
        title: "Afrobeats & Amapiano",
        date: "FEB 10",
        photos: 89,
        members: 156,
        img: "https://plus.unsplash.com/premium_photo-1708589337397-ad21d307bb9c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        title: "NYE Masquerade",
        date: "JAN 01",
        photos: 127,
        members: 84,
        img: "https://images.unsplash.com/photo-1592943450127-37342a006c34?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        title: "Beach Bonfire",
        date: "AUG 15",
        photos: 43,
        members: 12,
        img: "https://images.unsplash.com/photo-1596326270763-87f26e0f9225?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        title: "Rooftop Cinema",
        date: "SEP 22",
        photos: 65,
        members: 40,
        img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
];

const VaultSection = () => {
    return (
        <section className="py-24 md:py-32 bg-black relative">
            <div className="container mx-auto px-6">
                {/* Heading + Toggle */}
                <div className="text-center mb-16 md:mb-20">
                    <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                        The Digital <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-500">
                            Scrapbook.
                        </span>
                    </h2>

                    <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-xl mx-auto mb-10">
                        PXI automatically organizes your event history into
                        beautiful, interactive albums. Memories shouldn't live
                        in a folder.
                    </p>

                    <div className="flex justify-center">
                        <div className="bg-zinc-900/50 p-1.5 rounded-full border border-white/5 backdrop-blur-md flex items-center">
                            <button className="px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                                Events
                            </button>

                            <button className="px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-pxi-purple text-white neon-pill">
                                Scrapbook
                            </button>

                            <button className="px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                                Vault
                            </button>
                        </div>
                    </div>
                </div>

                {/* Album Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {albums.map((album, idx) => (
                        <div
                            key={idx}
                            className={`relative group overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/5 ${
                                idx === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                            }`}
                        >
                            <img
                                src={album.img}
                                alt={album.title}
                                className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 min-h-[280px] md:min-h-[300px]"
                            />

                            {/* Info Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight mb-2 leading-none">
                                    {album.title}
                                </h3>

                                <div className="flex items-center gap-4 text-zinc-400">
                                    <div className="flex items-center gap-1.5">
                                        <Camera size={14} />
                                        <span className="text-xs font-bold">
                                            {album.photos}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} />
                                        <span className="text-xs font-bold">
                                            {album.members}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Date Tag */}
                            <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1 glass rounded-full text-[9px] md:text-[10px] font-black tracking-widest text-white/80">
                                {album.date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VaultSection;
