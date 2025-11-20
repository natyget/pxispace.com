import { useRef, useEffect } from "react";

// Lightweight phone mockup with layered screens and pointer parallax.
// Props: layers: array of { src, alt }, size props optional
const PhoneMockup = ({ layers = [], width = 320, height = 640 }) => {
    const wrapRef = useRef(null);
    const stateRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 });

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        let rafId = null;

        const onMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX ?? (e.touches && e.touches[0].clientX)) || 0;
            const y = (e.clientY ?? (e.touches && e.touches[0].clientY)) || 0;
            const nx = (x - (rect.left + rect.width / 2)) / (rect.width / 2);
            const ny = (y - (rect.top + rect.height / 2)) / (rect.height / 2);

            // clamp
            const cx = Math.max(-1, Math.min(1, nx));
            const cy = Math.max(-1, Math.min(1, ny));

            stateRef.current.ry = cx * 6; // rotateY
            stateRef.current.rx = -cy * 6; // rotateX
            stateRef.current.tx = cx * 8; // translateX for layers
            stateRef.current.ty = cy * 8; // translateY for layers

            if (!rafId) {
                rafId = requestAnimationFrame(update);
            }
        };

        const update = () => {
            rafId = null;
            const s = stateRef.current;
            el.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;

            // update layers
            const layerEls = el.querySelectorAll("[data-layer]");
            layerEls.forEach((layer, i) => {
                const depth = (i + 1) / Math.max(1, layerEls.length);
                const mx = s.tx * depth * -1;
                const my = s.ty * depth * -1;
                layer.style.transform = `translate3d(${mx}px, ${my}px, 0) scale(${
                    1 - depth * 0.02
                })`;
            });
        };

        const onLeave = () => {
            stateRef.current = { rx: 0, ry: 0, tx: 0, ty: 0 };
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                el.style.transform = `rotateX(0deg) rotateY(0deg)`;
                const layerEls = el.querySelectorAll("[data-layer]");
                layerEls.forEach(
                    (layer) =>
                        (layer.style.transform = "translate3d(0,0,0) scale(1)")
                );
            });
        };

        el.addEventListener("mousemove", onMove);
        el.addEventListener("touchmove", onMove, { passive: true });
        el.addEventListener("mouseleave", onLeave);
        el.addEventListener("touchend", onLeave);

        return () => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("touchmove", onMove);
            el.removeEventListener("mouseleave", onLeave);
            el.removeEventListener("touchend", onLeave);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div
            ref={wrapRef}
            className="phone-mockup relative will-change-transform"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                transformStyle: "preserve-3d",
                perspective: "1200px",
            }}
        >
            {/* phone shell */}
            <div
                className="absolute inset-0 rounded-3xl bg-black border border-purple-500/20 shadow-2xl overflow-hidden"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
            >
                {/* screen area - layers stacked */}
                <div className="absolute inset-4 rounded-2xl bg-black overflow-hidden">
                    {layers.map((l, i) => (
                        <img
                            key={i}
                            data-layer
                            src={l.src}
                            alt={l.alt || `layer-${i}`}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
                            style={{ zIndex: 100 + i }}
                        />
                    ))}
                </div>

                {/* notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-30 opacity-60" />
            </div>
        </div>
    );
};

export default PhoneMockup;
