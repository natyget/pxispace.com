import { useEffect, useRef } from 'react';

// Matches mobile ParticleBackground: 25 particles, 30% purple / 70% white,
// slow drift with opacity oscillation, no connection lines.
export default function AuthParticles() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        const particles = Array.from({ length: 25 }, () => {
            const isPurple = Math.random() < 0.3;
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
                color: isPurple ? '176,38,255' : '255,255,255',
                shadowColor: isPurple ? '#B026FF' : '#ffffff',
                opacity: Math.random() * 0.4 + 0.1,
                opacityDir: Math.random() > 0.5 ? 1 : -1,
                opacitySpeed: 0.003 + Math.random() * 0.004,
            };
        });

        let rafId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Oscillate opacity
                p.opacity += p.opacityDir * p.opacitySpeed;
                if (p.opacity >= 0.6 || p.opacity <= 0.05) p.opacityDir *= -1;

                // Glow
                ctx.shadowColor = p.shadowColor;
                ctx.shadowBlur = p.radius * 2;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
                ctx.fill();

                ctx.shadowBlur = 0;
            }

            rafId = requestAnimationFrame(animate);
        };

        animate();
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
        />
    );
}
