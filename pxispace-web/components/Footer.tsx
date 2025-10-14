import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-violet/20 bg-gradient-to-b from-black/40 to-ink/60 backdrop-blur-xl">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-2xl font-extrabold mb-3 title-neon">PXI</h3>
            <p className="text-text-secondary/80 text-sm leading-relaxed mb-4">
              Transform your device into an instant camera. Making memories tangible again.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-secondary/70">
              <MapPin size={16} className="text-violet" />
              <span>Texas, USA</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#features" className="text-text-secondary/80 hover:text-white transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#events" className="text-text-secondary/80 hover:text-white transition-colors text-sm">
                  Public Events
                </Link>
              </li>
              <li>
                <a 
                  href="https://testflight.apple.com/join/3QqyXJwa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-text-secondary/80 hover:text-white transition-colors text-sm"
                >
                  Download App
                </a>
              </li>
              <li>
                <Link href="/help" className="text-text-secondary/80 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#about" className="text-text-secondary/80 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.kickstarter.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-text-secondary/80 hover:text-white transition-colors text-sm"
                >
                  Kickstarter
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contact@pxispace.com"
                  className="text-text-secondary/80 hover:text-white transition-colors text-sm inline-flex items-center gap-1.5"
                >
                  <Mail size={14} />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="text-text-secondary/80 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-secondary/80 hover:text-white transition-colors text-sm">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-violet/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-secondary/60 text-sm">
            © {currentYear} PXI Labs LLC. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a
              href="https://testflight.apple.com/join/3QqyXJwa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary/60 hover:text-violet transition-colors text-xs uppercase tracking-wider font-semibold"
            >
              Get Early Access
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

