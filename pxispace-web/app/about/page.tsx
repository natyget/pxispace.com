import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      {/* Hero Section */}
      <section className="py-20 pt-32 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">Our Story</h1>
          </div>

          {/* Story Content */}
          <div className="max-w-4xl mx-auto">
            {/* Opening Image */}
            <div className="mb-12">
              <div className="relative w-full max-w-2xl mx-auto">
                <Image
                  src="/assets/IMG_1505.JPG"
                  alt="Group of friends working together"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-3xl object-cover"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
            </div>

            {/* Story Text */}
            <div className="text-text-primary text-base md:text-lg leading-relaxed space-y-6 mb-12">
              <p>
                It all started with a group of international friends who loved bringing people together. We spent years organizing events, building connections, and learning what makes a party truly memorable. But eventually, the sheer hassle of managing it all began to overshadow the fun, and we stepped back.
              </p>
              
              <p>
                In our own private events, a new problem emerged. Photos and videos were constantly getting lost, scattered across dozens of camera rolls. The real magic happened months or years later when we&apos;d reunite. Someone would uncover a photo buried in their gallery—a perfect shot of you from their perspective. That feeling of rediscovering a lost moment was pure joy.
              </p>
            </div>

            {/* Team Images Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="relative">
                <Image
                  src="/assets/IMG_1506.JPG"
                  alt="Team member working"
                  width={400}
                  height={500}
                  className="w-full h-auto rounded-2xl object-cover"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
              <div className="relative">
                <Image
                  src="/assets/IMG_1507.JPG"
                  alt="Team member portrait"
                  width={400}
                  height={500}
                  className="w-full h-auto rounded-2xl object-cover"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
              <div className="relative">
                <Image
                  src="/assets/IMG_4764.jpeg"
                  alt="Team member portrait"
                  width={400}
                  height={500}
                  className="w-full h-auto rounded-2xl object-cover"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
            </div>

            {/* Final Story Text */}
            <div className="text-text-primary text-base md:text-lg leading-relaxed space-y-6">
              <p>
                That spark was the foundation for PXI. We first set out to solve that one problem: creating a shared album so no memory would be lost again. That single idea evolved into PXIStudio, our all-in-one platform designed to eliminate the friction we knew so well and elevate the entire social experience.
              </p>
              
              <p>
                As we tirelessly perfected the digital side, we wanted to bridge it with the physical world. We looked for a way to turn our phones into instant cameras, to hold a memory in our hands the moment it was made. That&apos;s why we created the PXIClip—to make the process truly seamless, from a flash on a screen to a photo in your pocket.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
