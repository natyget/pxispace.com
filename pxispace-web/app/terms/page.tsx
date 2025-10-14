import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — PXI",
  description: "Terms of use for PXI Labs LLC",
  openGraph: {
    title: "Terms & Conditions — PXI",
    description: "Terms of use for PXI Labs LLC",
    images: ["https://pxispace.com/assets/pxi-logo-og.png"],
  },
};

export default function TermsPage() {
  return (
    <main className="relative min-h-screen pt-20 pb-32">
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">
            Terms & Conditions
          </h1>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6 text-text-primary leading-relaxed">
          <p>
            This website is provided by <strong>PXI Labs LLC (Texas)</strong> as a preview of
            upcoming products. By using the site, you agree to these terms.
          </p>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Use of site</h2>
            <p>
              You agree not to misuse the site or interfere with its normal operation. Content may
              change at any time without notice.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Intellectual property</h2>
            <p>
              All trademarks, logos, images, videos, and copy are the property of PXI Labs LLC or our
              licensors and may not be used without permission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Waitlist</h2>
            <p>
              Submitting your email authorizes us to contact you about PXI. The waitlist does not
              guarantee access to products or early programs.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Cookies & Analytics</h2>
            <p>
              This site uses a functional cookie to remember cookie dismissal and Google Analytics 4
              (GA4) to understand traffic. GA4 anonymizes IPs. You can disable cookies via your
              browser.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Warranty & liability</h2>
            <p>
              This site is provided &quot;as-is&quot; without warranties. To the fullest extent permitted by
              law, PXI Labs LLC is not liable for indirect or consequential damages arising from use
              of the site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Governing law</h2>
            <p>These terms are governed by the laws of the State of Texas, USA.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-muted mb-3">Contact</h2>
            <p>
              For questions, email{" "}
              <Link href="mailto:contact@pxispace.com" className="text-neon-light hover:text-white underline">
                contact@pxispace.com
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

