import React from "react";
import { Calendar, MapPin, Ticket } from "lucide-react";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";




const EventCard = ({ event }) => {
    const navigate = useNavigate();
  return (
    <div className="group relative flex flex-col glass-dark rounded-[3rem] border border-white/5 hover:border-pxi-purple/30 transition-all duration-500 overflow-hidden">

      <div className="relative h-72 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="absolute top-8 left-8 px-4 py-1.5 glass rounded-full border-white/10 backdrop-blur-xl">
          <span className="text-[10px] font-black tracking-widest text-white uppercase">
            {event.status}
          </span>
        </div>

        <div className="absolute bottom-8 right-8 px-5 py-2.5 glass rounded-2xl border-white/20 backdrop-blur-md shadow-2xl">
          <span className="text-xl font-black text-white">
            {event.price}
          </span>
        </div>
      </div>

      <div className="p-10 flex-1 flex flex-col">

        <div className="flex items-center gap-3 mb-5">
          <Calendar size={16} className="text-pxi-purple" />
          <span className="text-[11px] font-black tracking-[0.2em] text-zinc-500 uppercase">
            {event.date}
          </span>
        </div>

        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-5 leading-none group-hover:text-pxi-purple transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-2 mb-10">
          <MapPin size={16} className="text-zinc-500" />
          <span className="text-sm font-bold text-zinc-400">
            {event.location}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://picsum.photos/40/40?random=${event.id + i}`}
                  className="w-10 h-10 rounded-full border-2 border-black"
                />
              ))}
            </div>

            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
              +{event.members}
            </span>
          </div>

          <Button
            variant="neon"
            className="!px-8 !py-3 !text-[11px] uppercase tracking-widest"
            icon={<Ticket size={16} />}
            onClick={() => navigate(`/events/${event.id}`)}
          >
            Join Vibe
          </Button>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pxi-purple/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

    </div>
  );
};

export default EventCard;
