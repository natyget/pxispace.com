import React from "react";
import Link from "next/link";
import Button from "../../components/ui/Button";
import { PXI_GET_APP_HREF } from "@/lib/appStoreLinks";
import IosDownloadLink from "@/components/links/IosDownloadLink";

const EventsCTA = () => {
  return (
    <section className="mt-48 mb-20">
      <div className="ticket-shape bg-pxi-purple p-14 md:p-24 rounded-[4rem] text-center relative overflow-hidden">

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
                className="bg-pxi-purple text-white hover:brightness-110 border-transparent px-16 py-5 text-lg"
              >
                Create an event
              </Button>
            </Link>

            <IosDownloadLink
              href={PXI_GET_APP_HREF}
              className="inline-flex items-center justify-center gap-2 px-16 py-5 text-lg rounded-full font-bold transition-all duration-300 ease-out transform active:scale-95 whitespace-nowrap bg-pxi-surface text-white hover:bg-white/10 bg-black/20 hover:bg-black/40"
            >
              Download the app
            </IosDownloadLink>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        </div>

      </div>
    </section>
  );
};

export default EventsCTA;
