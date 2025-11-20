import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Watches route changes and performs small cross-cutting concerns:
// - updates document.title to `PXI - {Page Name}`
// - scrolls to top on navigation
const RouteListener = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Map paths to friendly page titles. Add entries here as you add pages.
        const titles = {
            "/": "Home",
            "/features": "Features",
            "/about": "About us",
            "/shop": "Shop",
            "/tech": "Tech Showcase",
            "/support": "Support",
        };

        let page = titles[pathname];
        if (!page) {
            const parts = pathname.split("/").filter(Boolean);
            if (parts.length === 0) page = "PXI - Pick • Print • Post";
            else {
                const last = parts[parts.length - 1].replace(/[-_]/g, " ");
                page = last
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
            }
        }

        document.title = `PXI - ${page}`;

        // Scroll to top on navigation. Use 'auto' for broad browser support.
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname]);

    return null;
};

export default RouteListener;
