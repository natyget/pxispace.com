const PhoneMockup = ({ title, imgUrl, children, glow = false, className = '' }) => {
  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Optional neon purple bloom behind the frame */}
      {glow && (
        <div
          aria-hidden="true"
          className="absolute -z-10 pointer-events-none rounded-full"
          style={{
            inset: '-25%',
            background: 'rgba(216,74,255,0.18)',
            filter: 'blur(55px)',
          }}
        />
      )}

      {/* Device frame */}
      <div className="relative w-[210px] h-[450px] sm:w-[240px] sm:h-[500px] lg:w-[320px] lg:h-[680px] rounded-[2.2rem] lg:rounded-[3rem] border border-white/10 bg-black/80 backdrop-blur-2xl overflow-hidden transform-gpu will-change-transform">
        {/* Inner border reflection */}
        <div className="absolute inset-0 rounded-[2.2rem] lg:rounded-[3rem] border-2 border-white/5 pointer-events-none z-20" />

        {/* Screen area */}
        <div className="absolute top-[8px] left-[8px] right-[8px] bottom-[8px] lg:top-[12px] lg:left-[12px] lg:right-[12px] lg:bottom-[12px] rounded-[1.8rem] lg:rounded-[2.2rem] overflow-hidden bg-black border border-white/10 flex items-center justify-center">
          {children ? (
            <div className="absolute inset-0">{children}</div>
          ) : (
            <>
              <img
                src={imgUrl}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
                alt={title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
            </>
          )}

          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 lg:w-24 lg:h-7 bg-black rounded-full z-30 border border-white/5 flex justify-center items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500/80 rounded-full shadow-[0_0_5px_#22c55e]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
