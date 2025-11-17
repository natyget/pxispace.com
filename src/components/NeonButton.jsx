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
        "font-bold rounded-lg transition-all duration-300 inline-flex items-center justify-center cursor-pointer border";

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const variants = {
        primary:
            "bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-purple-500 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/50 hover:shadow-xl  hover:shadow-purple-500/70",
        outline:
            "border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50",
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
