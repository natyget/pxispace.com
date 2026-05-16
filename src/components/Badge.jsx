import { HugeiconsIcon } from '@hugeicons/react';
import React from "react";

const Badge = ({ icon: Icon, text, className = "" }) => {
    return (
        <>
            {/* <div className={`flex justify-center mb-12 ${className}`}> */}
                <div className="why-badge inline-flex items-center gap-2 border border-purple-500/40 bg-purple-500/10 backdrop-blur-sm rounded-full px-4 py-2 hover:border-purple-500/60 transition-colors duration-300">
                    <HugeiconsIcon icon={Icon} className="text-purple-400" size={18} />
                    <span className="text-sm font-semibold text-purple-300">
                        {text}
                    </span>
                </div>
            {/* </div> */}
        </>
    );
};

export default Badge;
