import { HugeiconsIcon } from '@hugeicons/react';
import React from "react";

const Badge = ({ icon: Icon, text, className = "" }) => {
    return (
        <>
            {/* <div className={`flex justify-center mb-12 ${className}`}> */}
                <div className="why-badge inline-flex items-center gap-2 bg-pxi-purple/15 rounded-full px-4 py-2 transition-colors duration-300 hover:bg-pxi-purple/25">
                    <HugeiconsIcon icon={Icon} className="text-pxi-purple" size={18} />
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">
                        {text}
                    </span>
                </div>
            {/* </div> */}
        </>
    );
};

export default Badge;
