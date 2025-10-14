"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Download, Sparkles } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/90 backdrop-blur-xl border-b border-violet/20 shadow-lg shadow-violet/5' 
          : 'bg-gradient-to-b from-black/65 to-black/20 backdrop-blur-lg'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-20 relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/assets/logo.webp"
                alt="PXI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight title-neon group-hover:scale-105 transition-transform">
              PXI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              href="/#features" 
              className="text-sm font-semibold text-text-secondary/90 hover:text-white transition-colors relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-violet to-violet-strong group-hover:w-full transition-all duration-300" />
            </Link>
            <Link 
              href="/#events" 
              className="text-sm font-semibold text-text-secondary/90 hover:text-white transition-colors relative group"
            >
              Events
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-violet to-violet-strong group-hover:w-full transition-all duration-300" />
            </Link>
            <Link 
              href="/help" 
              className="text-sm font-semibold text-text-secondary/90 hover:text-white transition-colors relative group"
            >
              Help
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-violet to-violet-strong group-hover:w-full transition-all duration-300" />
            </Link>
            
            <div className="h-6 w-px bg-violet/30" />
            
            <a
              href="https://testflight.apple.com/join/3QqyXJwa"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon-outline text-text-secondary px-5 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Download size={16} />
              Get App
            </a>
            <a
              href="https://www.kickstarter.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient text-white px-5 py-2.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Sparkles size={16} />
              Back Us
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-11 h-11 flex items-center justify-center text-text-secondary hover:text-white transition-colors rounded-xl hover:bg-violet/10"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col gap-1 py-4 border-t border-violet/20">
            <Link
              href="/#features"
              className="text-text-secondary hover:text-white hover:bg-violet/10 transition-colors py-3 px-4 rounded-lg font-medium"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#events"
              className="text-text-secondary hover:text-white hover:bg-violet/10 transition-colors py-3 px-4 rounded-lg font-medium"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/help"
              className="text-text-secondary hover:text-white hover:bg-violet/10 transition-colors py-3 px-4 rounded-lg font-medium"
              onClick={() => setIsOpen(false)}
            >
              Help
            </Link>
            
            <div className="h-px bg-violet/20 my-2" />
            
            <a
              href="https://testflight.apple.com/join/3QqyXJwa"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon-outline text-text-secondary px-4 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <Download size={18} />
              Get App
            </a>
            <a
              href="https://www.kickstarter.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient text-white px-4 py-3 rounded-lg font-bold inline-flex items-center justify-center gap-2 mt-2"
              onClick={() => setIsOpen(false)}
            >
              <Sparkles size={18} />
              Back Us on Kickstarter
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

