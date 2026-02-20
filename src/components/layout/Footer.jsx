import React from "react";
import { NavLink } from "react-router-dom";
import Button from "./../../components/ui/Button";
import { Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black pt-24 pb-12 border-t border-gray-900">
      <div className="container mx-auto px-6 text-center">

        

        {/* Links */}
        <div className="grid md:grid-cols-4 gap-8 text-left border-t border-gray-800 pt-12">

          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <NavLink to="/" className="flex items-center gap-2 mb-4 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-pxi-purple flex items-center justify-center">
                <span className="font-bold text-white">P</span>
              </div>
              <span className="text-2xl font-bold text-white">PXI</span>
            </NavLink>

            <p className="text-gray-500 max-w-xs">
              Your social life, unfiltered. Plan the party, share the camera roll,
              and relive the nostalgia.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-bold mb-4 text-white">Explore</h4>
            <ul className="space-y-2 text-gray-500">

              <li>
                <NavLink to="/" className="hover:text-pxi-purple transition-colors">
                  Home
                </NavLink>
              </li>

              <li>
                <NavLink to="/events" className="hover:text-pxi-purple transition-colors">
                  Events
                </NavLink>
              </li>

              <li>
                <NavLink to="/about" className="hover:text-pxi-purple transition-colors">
                  About
                </NavLink>
              </li>

              <li>
                <NavLink to="/#" className="hover:text-pxi-purple transition-colors">
                  Download App
                </NavLink>
              </li>

            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-gray-500">

              <li>
                <NavLink to="/privacy_policy" className="hover:text-pxi-purple transition-colors">
                  Privacy Policy
                </NavLink>
              </li>

              <li>
                <NavLink to="/terms_of_service" className="hover:text-pxi-purple transition-colors">
                  Terms of Service
                </NavLink>
              </li>

              <li>
                <NavLink to="/support" className="hover:text-pxi-purple transition-colors">
                  Support
                </NavLink>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-gray-900 text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} PXI App. All rights reserved.</p>

          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Twitter size={20} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
