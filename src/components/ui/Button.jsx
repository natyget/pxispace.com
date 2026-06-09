import React from "react";

const Button = ({
    children,
    variant = "primary",
    className = "",
    onClick,
    icon,
}) => {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 ease-out transform active:scale-95 whitespace-nowrap";

    const variants = {
        primary:
            "pill-solid",
        secondary:
            "pill-ghost",
        outline:
            "pill-ghost text-white",
        glass: "pill-ghost",
        neon: "neon-pill text-white hover:scale-105 active:scale-95",
        "neon-outlet":
            "neon-pill-outlet text-white hover:scale-102 active:scale-95",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
