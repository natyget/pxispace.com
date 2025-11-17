import { useEffect } from 'react';
import { gsap } from 'gsap';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import NeonButton from '../components/NeonButton';
import ParticleBackground from '../components/ParticleBackground';
import pxiHero from '../assets/pxi-hero.png';
import productAccessories from '../assets/product-accessories.jpg';

const Shop = () => {
  useEffect(() => {
    gsap.from('.shop-title', {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
    });

    gsap.from('.product-card', {
      opacity: 0,
      y: 30,
      stagger: 0.2,
      duration: 0.8,
      delay: 0.3,
      ease: 'power3.out',
    });
  }, []);

  const products = [
    {
      name: 'PXI Printer',
      price: '$199',
      description: 'The complete PXI instant photo printer with USB-C charging cable and starter pack of photo paper.',
      image: pxiHero,
      rating: 5,
      badge: 'Bestseller',
    },
    {
      name: 'Photo Paper Refill (50 sheets)',
      price: '$24.99',
      description: 'Premium quality photo paper for vibrant, long-lasting prints. Compatible with all PXI models.',
      image: productAccessories,
      rating: 5,
    },
    {
      name: 'PXI Protective Case',
      price: '$29.99',
      description: 'Durable protective case with space for your PXI and extra paper packs. Available in multiple colors.',
      image: productAccessories,
      rating: 4,
    },
    {
      name: 'Bundle: PXI + 3 Paper Packs',
      price: '$249',
      description: 'Save $25 when you bundle! Get the PXI printer with three 50-sheet paper refill packs.',
      image: pxiHero,
      rating: 5,
      badge: 'Best Value',
    },
  ];

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />

      <section className="relative py-32 px-4 pt-40">
        <div className="absolute inset-0 bg-gradient-radial" />
        
        <div className="container mx-auto relative z-10">
          <h1 className="shop-title text-5xl md:text-7xl font-bold text-gradient mb-8 text-center">
            Shop PXI
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-20">
            Get your PXI printer and accessories. Free shipping on orders over $150.
          </p>
        </div>
      </section>

      <section className="relative px-4 pb-24">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <div
                key={index}
                className="product-card bg-card border border-border rounded-3xl overflow-hidden card-glow hover:scale-[1.02] transition-all duration-300"
              >
                {product.badge && (
                  <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                    {product.badge}
                  </div>
                )}
                
                <div className="relative h-80 bg-secondary/20 flex items-center justify-center p-8">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain drop-shadow-2xl"
                  />
                </div>

                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`text-lg ${
                          i < product.rating ? 'text-primary fill-primary' : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold text-foreground">
                    {product.name}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-3xl font-bold text-neon">
                      {product.price}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors">
                        <FiShoppingCart className="text-xl" />
                      </button>
                      <NeonButton variant="primary" size="md">
                        Pre-Order
                      </NeonButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient">
            Questions About Your Order?
          </h2>
          <p className="text-xl text-foreground/90">
            Check our support center or contact our team for assistance.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Shop;
