import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-violet/20 bg-gradient-to-b from-black/40 to-ink/60 backdrop-blur-xl">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-secondary/60 text-sm">
            © {currentYear} PXI Labs LLC. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-text-secondary/60 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-text-secondary/60 hover:text-white transition-colors text-sm">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

