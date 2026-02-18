import React from "react";

const PhoneMockup = ({ src, alt, className = "" }) => {
  return (
    <div
      className={`relative rounded-[2.5rem] border-[8px] border-neutral-900 bg-black overflow-hidden shadow-2xl ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-neutral-900 rounded-b-xl z-20"></div>

      {/* Screen Content */}
      <div className="relative h-full w-full bg-neutral-800 overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />

        {/* Gloss Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
};

export default PhoneMockup;
