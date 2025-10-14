import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PXI",
  description: "Privacy practices of PXI Labs LLC",
  openGraph: {
    title: "Privacy Policy — PXI",
    description: "Privacy practices of PXI Labs LLC",
    images: ["https://pxispace.com/assets/pxi-logo-og.png"],
  },
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen pt-20 pb-32">
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">Privacy Policy</h1>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6 text-text-primary leading-relaxed">
          <p>
            <strong>PXI Labs LLC</strong> respects your privacy. We collect only information you
            intentionally submit, such as your email when you join our waitlist.
          </p>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Information collected</h2>
            <p>
              If you join the waitlist, we store your email to contact you about PXI. We do not sell
              or rent your personal information. We may use aggregated, non-identifying analytics to
              understand traffic and improve the site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Cookies & Analytics</h2>
            <p>
              We use a cookie to remember if you dismissed the cookie banner. We also use Google
              Analytics 4 (<code className="bg-black/40 px-2 py-0.5 rounded">G-KXR80WB7QK</code>)
              with anonymized IP to measure usage. GA4 may set cookies; you can block analytics in
              your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Retention</h2>
            <p>
              We retain submitted emails until you ask us to delete them or they are no longer needed
              for updates. You can unsubscribe anytime.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Contact</h2>
            <p>
              Questions? Email{" "}
              <a href="mailto:contact@pxispace.com" className="text-neon-light hover:text-white underline">
                contact@pxispace.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

