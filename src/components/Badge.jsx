import React from "react";

const Badge = ({ icon: Icon, text, variant = "default" }) => {
    const variants = {
        default:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 backdrop-blur-sm",
        subtle: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm",
        outlined:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-transparent border border-pink-500/40 backdrop-blur-sm",
    };

    const iconColors = {
        default: "text-pink-400",
        subtle: "text-gray-400",
        outlined: "text-pink-400",
    };

    const textColors = {
        default: "text-xs font-bold text-pink-300 uppercase tracking-widest",
        subtle: "text-xs font-bold text-gray-300 uppercase tracking-widest",
        outlined: "text-xs font-bold text-pink-300 uppercase tracking-widest",
    };

    return (
        <div className={variants[variant]}>
            {Icon && <Icon className={`${iconColors[variant]}`} size={16} />}
            <span className={textColors[variant]}>{text}</span>
        </div>
    );
};

export default Badge;
