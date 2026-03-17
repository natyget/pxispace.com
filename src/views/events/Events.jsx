'use client';

import React, { useState, useEffect } from "react";
import EventsHero from "./EventsHero";
import EventsFilters from "./EventsFilters";
import EventsGrid from "./EventsGrid";
import EventsEmpty from "./EventsEmpty";
import EventsCTA from "./EventsCTA";
import { eventsService } from "../../services/events";

const publicEvents = [
    {
        id: 1,
        title: "Neon Echoes: Underground Rave",
        date: "MAR 15, 2026",
        location: "Concrete Gallery, London",
        members: 1240,
        type: "Music",
        status: "Trending",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070",
        price: "£25.00",
    },
    {
        id: 2,
        title: "Silicon Sunset: Tech Mixer",
        date: "MAR 18, 2026",
        location: "Sky Lounge, San Francisco",
        members: 450,
        type: "Social",
        status: "Nearly Full",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070",
        price: "Free",
    },
    {
        id: 3,
        title: "Hyperlink: Digital Art Expo",
        date: "APR 02, 2026",
        location: "Virtual / Tokyo Hub",
        members: 8900,
        type: "Art",
        status: "Global",
        image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070",
        price: "£15.00",
    },
    {
        id: 4,
        title: "Deep House Rooftop Sessions",
        date: "APR 12, 2026",
        location: "The Highline, NYC",
        members: 200,
        type: "Music",
        status: "Invite Only",
        image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070",
        price: "£45.00",
    },
    {
        id: 5,
        title: "Midnight Masquerade",
        date: "APR 20, 2026",
        location: "Grand Palace, Paris",
        members: 800,
        type: "Social",
        status: "Trending",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070",
        price: "£120.00",
    },
    {
        id: 6,
        title: "Founders & Funders Night",
        date: "MAY 05, 2026",
        location: "The Vault, Berlin",
        members: 120,
        type: "Tech",
        status: "High Demand",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2040",
        price: "Free",
    },
    {
        id: 7,
        title: "Sahara Nights: Amapiano",
        date: "MAY 15, 2026",
        location: "Oasis Club, Dubai",
        members: 3000,
        type: "Music",
        status: "Selling Fast",
        image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
        price: "£60.00",
    },
    {
        id: 8,
        title: "Indie Rock Rewind",
        date: "MAY 22, 2026",
        location: "The Garage, Manchester",
        members: 600,
        type: "Music",
        status: "Public",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2070",
        price: "£10.00",
    },
    {
        id: 9,
        title: "Zen & Yoga Workshop",
        date: "JUN 01, 2026",
        location: "Botanical Gardens, Bali",
        members: 50,
        type: "Wellness",
        status: "Exclusive",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920",
        price: "£30.00",
    },
    {
        id: 10,
        title: "Esports Arena Championship",
        date: "JUN 10, 2026",
        location: "Cyber Arena, Seoul",
        members: 15000,
        type: "Gaming",
        status: "Global",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070",
        price: "£20.00",
    },
];

const normalizeApiEvent = (e) => ({
  id: e.id,
  title: e.name,
  image: e.coverImage || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070",
  location: e.location || "TBA",
  date: e.startDate ? new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA",
  members: e._count?.tickets ?? 0,
  type: e.ticketType === "PAID" ? "Paid" : "Free",
  status: e.effectiveStatus || e.visibility || "Public",
  price: e.ticketType === "PAID" && e.ticketPrice != null ? `$${Number(e.ticketPrice).toFixed(2)}` : "Free",
});

const Events = () => {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiEvents, setApiEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    eventsService
      .getPublicEvents(20, 0)
      .then((res) => setApiEvents((res.events || []).map(normalizeApiEvent)))
      .catch(() => setApiEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  const allEvents = apiEvents.length > 0 ? apiEvents : publicEvents;

  const filteredEvents = allEvents.filter((event) => {
    const matchesFilter = filter === "All" || event.type === filter;
    const matchesSearch =
      (event.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="pt-32 pb-24 min-h-screen bg-black overflow-hidden relative">
      
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pxi-purple/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto px-6">

        <EventsHero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <EventsFilters
          filter={filter}
          setFilter={setFilter}
        />

        {filteredEvents.length > 0 ? (
          <EventsGrid events={filteredEvents} />
        ) : (
          <EventsEmpty
            reset={() => {
              setFilter("All");
              setSearchQuery("");
            }}
          />
        )}

        <EventsCTA />

      </div>
    </div>
  );
};

export default Events;




// import React, { useState } from "react";
// import Button from "./../../components/ui/Button";
// import { Calendar, MapPin, Users, Filter, Search, Ticket } from "lucide-react";

// const publicEvents = [
//     {
//         id: 1,
//         title: "Neon Echoes: Underground Rave",
//         date: "MAR 15, 2026",
//         location: "Concrete Gallery, London",
//         members: 1240,
//         type: "Music",
//         status: "Trending",
//         image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070",
//         price: "£25.00",
//     },
//     {
//         id: 2,
//         title: "Silicon Sunset: Tech Mixer",
//         date: "MAR 18, 2026",
//         location: "Sky Lounge, San Francisco",
//         members: 450,
//         type: "Social",
//         status: "Nearly Full",
//         image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070",
//         price: "Free",
//     },
//     {
//         id: 3,
//         title: "Hyperlink: Digital Art Expo",
//         date: "APR 02, 2026",
//         location: "Virtual / Tokyo Hub",
//         members: 8900,
//         type: "Art",
//         status: "Global",
//         image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070",
//         price: "£15.00",
//     },
//     {
//         id: 4,
//         title: "Deep House Rooftop Sessions",
//         date: "APR 12, 2026",
//         location: "The Highline, NYC",
//         members: 200,
//         type: "Music",
//         status: "Invite Only",
//         image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070",
//         price: "£45.00",
//     },
//     {
//         id: 5,
//         title: "Midnight Masquerade",
//         date: "APR 20, 2026",
//         location: "Grand Palace, Paris",
//         members: 800,
//         type: "Social",
//         status: "Trending",
//         image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070",
//         price: "£120.00",
//     },
//     {
//         id: 6,
//         title: "Founders & Funders Night",
//         date: "MAY 05, 2026",
//         location: "The Vault, Berlin",
//         members: 120,
//         type: "Tech",
//         status: "High Demand",
//         image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2040",
//         price: "Free",
//     },
//     {
//         id: 7,
//         title: "Sahara Nights: Amapiano",
//         date: "MAY 15, 2026",
//         location: "Oasis Club, Dubai",
//         members: 3000,
//         type: "Music",
//         status: "Selling Fast",
//         image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
//         price: "£60.00",
//     },
//     {
//         id: 8,
//         title: "Indie Rock Rewind",
//         date: "MAY 22, 2026",
//         location: "The Garage, Manchester",
//         members: 600,
//         type: "Music",
//         status: "Public",
//         image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2070",
//         price: "£10.00",
//     },
//     {
//         id: 9,
//         title: "Zen & Yoga Workshop",
//         date: "JUN 01, 2026",
//         location: "Botanical Gardens, Bali",
//         members: 50,
//         type: "Wellness",
//         status: "Exclusive",
//         image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1920",
//         price: "£30.00",
//     },
//     {
//         id: 10,
//         title: "Esports Arena Championship",
//         date: "JUN 10, 2026",
//         location: "Cyber Arena, Seoul",
//         members: 15000,
//         type: "Gaming",
//         status: "Global",
//         image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070",
//         price: "£20.00",
//     },
// ];

// const Events = () => {
//     const [filter, setFilter] = useState("All");
//     const [searchQuery, setSearchQuery] = useState("");

//     const filteredEvents = publicEvents.filter((event) => {
//         const matchesFilter = filter === "All" || event.type === filter;
//         const matchesSearch =
//             event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             event.location.toLowerCase().includes(searchQuery.toLowerCase());
//         return matchesFilter && matchesSearch;
//     });

//     const filterOptions = ["All", "Music", "Social", "Tech", "Art", "Gaming"];

//     return (
//     <div className="pt-32 pb-24 min-h-screen bg-black overflow-hidden">
//       {/* Ambience */}
//       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pxi-purple/10 blur-[150px] rounded-full -z-10"></div>
//       <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full -z-10"></div>

//       <div className="container mx-auto px-6">
        
//         {/* Header Section */}
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-16">
//           <div className="flex-1 lg:max-w-[60%]">
//             <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
//               Public <br/>
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple via-pink-400 to-white">Events</span>
//             </h1>
//             <p className="text-zinc-500 text-xl md:text-2xl font-medium max-w-xl leading-relaxed">
//               Find your next obsession. Join exclusive gatherings, music festivals, and community hangouts powered by PXI.
//             </p>
//           </div>

//           {/* Search & Filter - Expanded to fill the right side space */}
//           <div className="flex-1 w-full flex flex-col items-stretch lg:items-end gap-6">
//             <div className="relative group w-full lg:max-w-md">
//                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pxi-purple transition-colors" size={22} />
//                <input 
//                  type="text" 
//                  placeholder="Search events, cities, genres..." 
//                  className="w-full bg-zinc-900/40 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-lg text-white focus:outline-none focus:border-pxi-purple/50 focus:bg-zinc-900 transition-all backdrop-blur-sm"
//                  value={searchQuery}
//                  onChange={(e) => setSearchQuery(e.target.value)}
//                />
//             </div>
//             <div className="flex gap-4 self-stretch lg:self-auto">
//               <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 glass rounded-2xl text-sm font-black uppercase tracking-widest border-white/10 hover:bg-white/5 transition-colors">
//                 <Filter size={20} />
//                 <span>Sort By Vibe</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Filter Tabs - Styled as a more prominent row */}
//         <div className="flex items-center gap-3 overflow-x-auto pb-10 no-scrollbar scroll-smooth">
//           {filterOptions.map((opt) => (
//             <button
//               key={opt}
//               onClick={() => setFilter(opt)}
//               className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 border ${
//                 filter === opt 
//                 ? 'bg-pxi-purple text-white border-pxi-purple shadow-[0_0_30px_rgba(216,74,255,0.4)] scale-105' 
//                 : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20'
//               }`}
//             >
//               {opt}
//             </button>
//           ))}
//         </div>

//         {/* Events Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
//           {filteredEvents.map((event) => (
//             <div 
//               key={event.id} 
//               className="group relative flex flex-col glass-dark rounded-[3rem] border border-white/5 hover:border-pxi-purple/30 transition-all duration-500 overflow-hidden"
//             >
//               {/* Image Container */}
//               <div className="relative h-72 overflow-hidden">
//                 <img 
//                   src={event.image} 
//                   alt={event.title} 
//                   className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
//                 {/* Status Badge */}
//                 <div className="absolute top-8 left-8 px-4 py-1.5 glass rounded-full border-white/10 backdrop-blur-xl">
//                   <span className="text-[10px] font-black tracking-widest text-white uppercase">{event.status}</span>
//                 </div>

//                 {/* Price Badge */}
//                 <div className="absolute bottom-8 right-8 px-5 py-2.5 glass rounded-2xl border-white/20 backdrop-blur-md shadow-2xl">
//                    <span className="text-xl font-black text-white">{event.price}</span>
//                 </div>
//               </div>

//               {/* Content Container */}
//               <div className="p-10 flex-1 flex flex-col">
//                 <div className="flex items-center gap-3 mb-5">
//                   <Calendar size={16} className="text-pxi-purple" />
//                   <span className="text-[11px] font-black tracking-[0.2em] text-zinc-500 uppercase">{event.date}</span>
//                 </div>
                
//                 <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-5 leading-none group-hover:text-pxi-purple transition-colors">
//                   {event.title}
//                 </h3>
                
//                 <div className="flex items-center gap-2 mb-10">
//                   <MapPin size={16} className="text-zinc-500" />
//                   <span className="text-sm font-bold text-zinc-400">{event.location}</span>
//                 </div>

//                 <div className="mt-auto flex items-center justify-between gap-4">
//                   <div className="flex items-center gap-3">
//                     <div className="flex -space-x-3">
//                       {[1,2,3].map(i => (
//                         <img key={i} src={`https://picsum.photos/40/40?random=${event.id + i}`} className="w-10 h-10 rounded-full border-2 border-black" />
//                       ))}
//                     </div>
//                     <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">+{event.members}</span>
//                   </div>
//                   <Button variant="neon" className="!px-8 !py-3 !text-[11px] uppercase tracking-widest" icon={<Ticket size={16} />}>
//                     Join Vibe
//                   </Button>
//                 </div>
//               </div>

//               {/* Decorative Corner Glow */}
//               <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pxi-purple/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
//             </div>
//           ))}
//         </div>

//         {/* Empty State */}
//         {filteredEvents.length === 0 && (
//           <div className="py-40 text-center">
//             <h3 className="text-4xl font-black uppercase text-zinc-800 mb-6 tracking-tighter">No signals in this frequency</h3>
//             <p className="text-zinc-500 mb-12 max-w-sm mx-auto text-lg">Try a different vibe or clear your search to find the perfect party.</p>
//             <Button variant="glass" className="px-12 py-4 text-sm" onClick={() => {setFilter('All'); setSearchQuery('')}}>Reset Explorer</Button>
//           </div>
//         )}

//         {/* Call to Action at Bottom */}
//         <section className="mt-48 mb-20">
//           <div className="ticket-shape bg-gradient-to-r from-pxi-purple via-pink-600 to-indigo-600 p-14 md:p-24 rounded-[4rem] text-center relative overflow-hidden shadow-[0_0_100px_rgba(216,74,255,0.2)]">
//              <div className="relative z-10">
//                 <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-10 leading-[0.85]">
//                   Host Your Own <br/>Public Event
//                 </h2>
//                 <p className="text-white/80 text-xl md:text-2xl font-medium max-w-3xl mx-auto mb-14 leading-relaxed">
//                   Ready to go viral? PXI gives you the power to market, ticket, and capture your events with professional precision.
//                 </p>
//                 <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
//                   <Button variant="glass" className="bg-white text-black hover:bg-white/90 border-transparent px-16 py-5 text-lg">
//                     Get Started
//                   </Button>
//                   <Button variant="glass" className="bg-black/20 hover:bg-black/40 border-white/20 text-white px-16 py-5 text-lg">
//                     Learn More
//                   </Button>
//                 </div>
//              </div>
//              {/* Background Mesh */}
//              <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
//                 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/30 blur-[150px] rounded-full"></div>
//                 <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/60 blur-[150px] rounded-full"></div>
//              </div>
//           </div>
//         </section>

//       </div>
//     </div>
//   );
// };

// export default Events;
