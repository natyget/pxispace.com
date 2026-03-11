'use client';

import React from "react";
import Link from "next/link";
const LogoSVG = "/images/logo.svg";
import { Instagram } from "lucide-react";
import { FaTiktok } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-black pt-24 pb-12 border-t border-gray-900">
            <div className="container mx-auto px-6 text-center">
                <div className="grid md:grid-cols-4 gap-8 text-left border-t border-gray-800 pt-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link
                            href="/"
                            className="flex items-center gap-2 mb-4 cursor-pointer"
                        >
                            <img
                                src={LogoSVG}
                                alt="PXI Logo"
                                className="h-8 w-8"
                            />
                        </Link>
                        <p className="text-gray-500 max-w-xs">
                            Your social life, unfiltered. Plan the party, share
                            the camera roll, and relive the nostalgia.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4 text-white">Explore</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li>
                                <Link href="/" className="hover:text-pxi-purple transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/events" className="hover:text-pxi-purple transition-colors">
                                    Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-pxi-purple transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/#" className="hover:text-pxi-purple transition-colors">
                                    Download App
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4 text-white">Legal</h4>
                        <ul className="space-y-2 text-gray-500">
                            <li>
                                <Link href="/privacy_policy" className="hover:text-pxi-purple transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms_of_service" className="hover:text-pxi-purple transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/support" className="hover:text-pxi-purple transition-colors">
                                    Support
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-gray-900 text-gray-600 text-sm">
                    <p>
                        &copy; {new Date().getFullYear()} PXI App. All rights
                        reserved.
                    </p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a
                            href="https://www.instagram.com/pxilabs/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors"
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href="https://www.tiktok.com/@pxi.labs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors"
                        >
                            <FaTiktok size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
