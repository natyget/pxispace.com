import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiSmartphone, FiBluetooth, FiBattery, FiPackage, FiImage, FiClock } from 'react-icons/fi';
import ParticleBackground from '../components/ParticleBackground';
const pxiHero = "/images/pxi-hero.png";

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
 

  const features = [
    {
      icon: FiSmartphone,
      title: 'Universal Compatibility',
      description: 'Works seamlessly with iOS and Android devices. Simply attach PXI to your phone and start printing.',
      image: pxiHero,
    },
    {
      icon: FiBluetooth,
      title: 'Wireless Connection',
      description: 'Connect via Bluetooth in seconds. No cables, no hassle, just instant connectivity.',
      image: pxiHero,
    },
    {
      icon: FiImage,
      title: 'High-Quality Prints',
      description: 'Enjoy vibrant, fade-resistant photos with our advanced thermal printing technology.',
      image: pxiHero,
    },
    {
      icon: FiBattery,
      title: 'Long Battery Life',
      description: 'Print up to 50 photos on a single charge. Perfect for all-day events and adventures.',
      image: pxiHero,
    },
    {
      icon: FiPackage,
      title: 'Compact Design',
      description: 'Sleek and portable. Fits in your pocket and weighs less than your wallet.',
      image: pxiHero,
    },
    {
      icon: FiClock,
      title: 'Instant Printing',
      description: 'Photos ready in 10 seconds. No waiting, no delays, just instant memories.',
      image: pxiHero,
    },
  ];

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      <section className="relative py-32 px-4 pt-40">
        <div className="absolute inset-0 bg-gradient-radial" />
        
        <div className="container mx-auto relative z-10">
          <h1 className="features-title text-5xl md:text-7xl font-bold text-gradient mb-8 text-center">
            Powerful Features
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-20">
            Experience the perfect blend of cutting-edge technology and user-friendly design.
          </p>
        </div>
      </section>

      <section className="relative px-4 pb-24">
        <div className="container mx-auto max-w-6xl space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-row grid md:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className={`space-y-6 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                <div className="inline-block p-4 bg-card border-glow rounded-2xl">
                  <feature.icon className="text-5xl text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-neon">
                  {feature.title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full" />
              </div>

              <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="relative z-10 w-full h-auto drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient">
            Ready to Experience PXI?
          </h2>
          <p className="text-xl text-foreground/90">
            Join thousands of users who are making their memories tangible again.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Features;
