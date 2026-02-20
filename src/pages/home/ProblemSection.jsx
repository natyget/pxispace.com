import React from "react";

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-24 bg-[#080808] relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* The Ticket Element */}
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -inset-10 bg-pxi-purple/5 blur-[100px] rounded-full"></div>
          
          <div className="ticket-shape bg-gradient-to-br from-pxi-purple to-pink-600 p-8 md:p-14 lg:p-20 rounded-[2.5rem] md:rounded-[3rem] relative overflow-hidden group">
            
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-30 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6 md:mb-8">
                  Ditch the <br />
                  Spreadsheet.
                </h2>

                <p className="text-white/90 text-base md:text-xl font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                  Lost photos, confusing group chats, and the hassle of 5+ apps just to get people in the door?
                </p>

                <div className="mt-8 pt-6 border-t border-white/20 inline-block md:block">
                  <p className="text-xl md:text-2xl font-black italic uppercase tracking-widest text-white/95">
                    We're Over It.
                  </p>
                </div>
              </div>

              {/* QR Section */}
              <div className="w-48 h-48 md:w-64 md:h-64 glass rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center border-white/20 p-6 md:p-8 flex-shrink-0 self-center md:self-auto">
                <div className="w-full aspect-square bg-white p-3 rounded-xl mb-4">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PXI&bgcolor=ffffff"
                    alt="QR"
                    className="w-full h-full"
                  />
                </div>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  Cut the Bulk
                </p>
              </div>
            </div>

            {/* Dash Line Divider */}
            <div className="absolute top-0 bottom-0 right-[45%] lg:right-[35%] border-l-2 border-dashed border-white/20 hidden md:block"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
