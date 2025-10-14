import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & Support — PXI",
  description: "Get help with PXI Studio and PXIClip. Find answers to common questions and contact support.",
  openGraph: {
    title: "Help & Support — PXI",
    description: "Get help with PXI Studio and PXIClip. Find answers to common questions and contact support.",
    images: ["https://pxispace.com/assets/pxi-logo-og.png"],
  },
};

export default function HelpPage() {
  return (
    <main className="relative min-h-screen pt-20 pb-32">
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">
            Help & Support
          </h1>
          <p className="text-text-primary text-lg max-w-2xl mx-auto">
            Need assistance with PXI Studio or PXIClip? We&apos;re here to help you get the most out of
            your instant printing experience.
          </p>
        </div>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-glow">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                How do I connect PXIClip to my phone?
              </h3>
              <p className="text-text-secondary/80 leading-relaxed">
                Simply snap PXIClip magnetically to your phone. The device will automatically wake
                and connect via Bluetooth. Make sure Bluetooth is enabled on your device.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                What paper sizes does PXIClip support?
              </h3>
              <p className="text-text-secondary/80 leading-relaxed">
                PXIClip is designed to work with standard instant photo paper (2.1&quot; x 3.4&quot;).
                Replacement paper packs are available through our store.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                How do I create a shared event album?
              </h3>
              <p className="text-text-secondary/80 leading-relaxed">
                In PXI Studio, tap the &quot;+&quot; button and select &quot;Create Event Album&quot;. Share the
                generated link or QR code with friends to let them join and contribute photos.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                Can I use PXIClip without the app?
              </h3>
              <p className="text-text-secondary/80 leading-relaxed">
                PXIClip requires the PXI Studio app for full functionality. The app handles photo
                processing, filter application, and print commands.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                How long does the battery last?
              </h3>
              <p className="text-text-secondary/80 leading-relaxed">
                PXIClip&apos;s battery provides up to 8 hours of active printing time. It automatically
                enters sleep mode when not in use to preserve battery life.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                What if my print quality is poor?
              </h3>
              <p className="text-text-secondary/80 leading-relaxed">
                Ensure the paper is properly loaded, clean the print head with the provided cleaning
                tool, and make sure your phone is securely connected to PXIClip.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-glow">Contact Support</h2>
          <div className="grid md:grid-cols-1 gap-6">
            <div className="glass rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-semibold text-text-muted mb-3">Email Support</h3>
              <p className="text-text-secondary/80 mb-6">
                For technical issues or general inquiries:
              </p>
              <a
                href="mailto:support@pxispace.com"
                className="btn-neon-outline px-6 py-3 rounded-xl font-semibold text-[#eae6ff] inline-block"
              >
                support@pxispace.com
              </a>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-glow">Troubleshooting</h2>
          
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">
                PXIClip won&apos;t connect
              </h3>
              <ul className="space-y-2 text-text-secondary/80">
                <li>• Ensure Bluetooth is enabled on your device</li>
                <li>• Check that PXIClip is charged and powered on</li>
                <li>• Try restarting the PXI Studio app</li>
                <li>• Remove PXIClip and re-snap it to your phone</li>
              </ul>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">Printing issues</h3>
              <ul className="space-y-2 text-text-secondary/80">
                <li>• Verify paper is loaded correctly in PXIClip</li>
                <li>• Check that the print head is clean</li>
                <li>• Ensure your phone is securely attached to PXIClip</li>
                <li>• Try printing a test image to isolate the issue</li>
              </ul>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-text-muted mb-3">App crashes or freezes</h3>
              <ul className="space-y-2 text-text-secondary/80">
                <li>• Close and restart the PXI Studio app</li>
                <li>• Check for app updates in the App Store or TestFlight</li>
                <li>• Restart your device if problems persist</li>
                <li>• Contact support with details about when the crash occurs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-glow">Quick Links</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/" className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff]">
              View Features
            </Link>
            <a
              href="https://testflight.apple.com/join/3QqyXJwa"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff]"
            >
              Join TestFlight
            </a>
            <Link href="/" className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff]">
              About PXI Labs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

