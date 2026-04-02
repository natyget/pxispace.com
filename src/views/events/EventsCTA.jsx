import React from "react";
import Link from "next/link";
import Button from "../../components/ui/Button";

const EventsCTA = () => {
  return (
    <section className="mt-48 mb-20">
      <div className="ticket-shape bg-gradient-to-r from-pxi-purple via-pink-600 to-indigo-600 p-14 md:p-24 rounded-[4rem] text-center relative overflow-hidden shadow-[0_0_100px_rgba(216,74,255,0.2)]">

        <div className="relative z-10">
          <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-10 leading-[0.85]">
            Host Your Own <br />Public Event
          </h2>

          <p className="text-white/80 text-xl md:text-2xl font-medium max-w-3xl mx-auto mb-14 leading-relaxed">
            Ready to go viral? PXI gives you the power to market, ticket, and
            capture your events with professional precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard/events">
              <Button
                variant="glass"
                className="bg-white text-black hover:bg-white/90 border-transparent px-16 py-5 text-lg"
              >
                Create an event
              </Button>
            </Link>

            <a href={process.env.NEXT_PUBLIC_IOS_APP_URL || "https://testflight.apple.com/join/3QqyXJwa"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="glass"
                className="bg-black/20 hover:bg-black/40 border-white/20 text-white px-16 py-5 text-lg"
              >
                Download the app
              </Button>
            </a>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/30 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/60 blur-[150px] rounded-full" />
        </div>

      </div>
    </section>
  );
};

export default EventsCTA;
