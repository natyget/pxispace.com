// const NeonButton = ({
//     children,
//     variant = "primary",
//     size = "md",
//     className = "",
//     ...props
// }) => {
//     const baseStyles =
//         "font-semibold rounded-lg transition-all duration-300 relative overflow-hidden";

//     const variants = {
//         primary:
//             "bg-primary hover:bg-primary/90 text-primary-foreground border-glow animate-pulse-glow",
//         secondary:
//             "bg-secondary hover:bg-secondary/90 text-secondary-foreground border border-border",
//         outline: "bg-transparent hover:bg-primary/10 text-primary border-glow",
//     };

//     const sizes = {
//         sm: "px-4 py-2 text-sm",
//         md: "px-6 py-3 text-base",
//         lg: "px-8 py-4 text-lg",
//     };

//     const mergedClasses =
//         `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();

//     return (
//         <button
//             className={mergedClasses}
//             {...props}
//         >
//             {children}
//         </button>
//     );
// };

// export default NeonButton;
import React from "react";

const NeonButton = ({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) => {
    const baseStyles =
        "font-black uppercase tracking-[0.08em] rounded-full transition-all duration-200 inline-flex items-center justify-center cursor-pointer border-0";

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    // App look: flat purple primary, flat grey secondary; no gradient, no glow.
    const variants = {
        primary: "bg-pxi-purple text-white hover:brightness-110",
        outline: "bg-pxi-cancel text-white hover:bg-[#5a5a5a]",
    };

    return (
        <button
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default NeonButton;
