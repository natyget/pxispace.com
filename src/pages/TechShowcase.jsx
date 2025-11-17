import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiCpu, FiZap, FiLayers, FiActivity } from 'react-icons/fi';
import ParticleBackground from '../components/ParticleBackground';
import techImage from '../assets/tech-innovation.jpg';

gsap.registerPlugin(ScrollTrigger);

const TechShowcase = () => {
  useEffect(() => {
    gsap.from('.tech-title', {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
    });

    gsap.utils.toArray('.tech-card').forEach((card) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
        },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out',
      });
    });

    gsap.from('.tech-image', {
      scrollTrigger: {
        trigger: '.tech-image',
        start: 'top 80%',
      },
      opacity: 0,
      scale: 0.9,
      duration: 1.2,
      ease: 'power3.out',
    });
  }, []);

  const technologies = [
    {
      icon: FiCpu,
      title: 'Advanced Thermal Engine',
      description: 'Our proprietary thermal printing engine delivers consistent, high-quality prints with minimal power consumption.',
    },
    {
      icon: FiZap,
      title: 'ZINK Technology',
      description: 'Zero-ink printing eliminates cartridges and mess. Embedded dye crystals activate with precise heat application.',
    },
    {
      icon: FiLayers,
      title: 'Multi-Layer Processing',
      description: 'Each photo goes through multiple heating cycles to achieve perfect color depth and vibrancy.',
    },
    {
      icon: FiActivity,
      title: 'Smart Power Management',
      description: 'Intelligent battery optimization ensures maximum prints per charge without compromising quality.',
    },
  ];

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      <section className="relative py-32 px-4 pt-40">
        <div className="absolute inset-0 bg-gradient-radial" />
        
        <div className="container mx-auto relative z-10">
          <h1 className="tech-title text-5xl md:text-7xl font-bold text-gradient mb-8 text-center">
            The Technology Behind PXI
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-20">
            Innovation meets precision in every print. Discover the engineering excellence that powers PXI.
          </p>
        </div>
      </section>

      <section className="relative px-4 pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="tech-image mb-24">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <img
                src={techImage}
                alt="PXI Technology"
                className="relative z-10 w-full h-auto rounded-3xl drop-shadow-2xl border-glow"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className="tech-card p-8 bg-card border-glow rounded-2xl card-glow space-y-4"
              >
                <div className="inline-block p-4 bg-secondary/20 rounded-2xl">
                  <tech.icon className="text-5xl text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-neon">
                  {tech.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-card border-glow rounded-3xl p-12 card-glow">
            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-8 text-center">
              Continuous Innovation
            </h2>
            <div className="space-y-6 text-lg text-foreground/90 leading-relaxed max-w-4xl mx-auto">
              <p>
                At PXI, we're committed to pushing the boundaries of instant printing technology. 
                Our research and development team works tirelessly to enhance every aspect of the printing experience.
              </p>
              <p>
                From improving color accuracy to extending battery life, we're constantly innovating to ensure 
                PXI remains the most advanced instant printer on the market.
              </p>
              <p>
                Every firmware update brings new features and improvements, making your PXI better over time. 
                That's our promise to you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechShowcase;
