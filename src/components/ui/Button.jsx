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
        "inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 rounded-full text-[13px] font-black uppercase tracking-[0.08em] transition-all duration-200 ease-out transform active:scale-[0.98] whitespace-nowrap disabled:pointer-events-none disabled:opacity-50";

    // App look: flat purple primary, flat grey cancel/secondary, orange share. No glow, no glass.
    const variants = {
        primary: "bg-pxi-purple text-white hover:brightness-110",
        neonOrange: "bg-pxi-orange/15 text-pxi-orange hover:bg-pxi-orange/25",
        secondary: "bg-pxi-cancel text-white hover:bg-[#5a5a5a]",
        outline: "bg-pxi-cancel text-white hover:bg-[#5a5a5a]",
        glass: "bg-pxi-field text-white hover:bg-[#3a3a3a]",
        neon: "bg-pxi-purple text-white hover:brightness-110",
        "neon-outlet": "bg-pxi-field text-white hover:bg-[#3a3a3a]",
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
