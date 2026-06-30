import React from "react";

const Button = ({
    children,
    variant = "primary",
    className = "",
    onClick,
    icon,
    type = "button",
    disabled = false,
    ...props
}) => {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 ease-out transform active:scale-95 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary:
            "bg-pxi-purple text-white shadow-[0_0_20px_rgba(216,74,255,0.4)] hover:shadow-[0_0_30px_rgba(216,74,255,0.6)]",
        neonOrange:
            "pxi-orange-pill text-white hover:scale-105 active:scale-95",
        secondary:
            "bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800",
        outline:
            "bg-transparent border-2 border-pxi-purple text-pxi-purple hover:bg-pxi-purple/10",
        glass: "glass text-white hover:bg-white/10",
        neon: "neon-pill text-white hover:scale-105 active:scale-95",
        "neon-outlet":
            "neon-pill-outlet text-white hover:scale-102 active:scale-95",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            type={type}
            disabled={disabled}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
