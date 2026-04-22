'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const sections = [
    {
        heading: "Account & Access",
        items: [
            {
                q: "How do I create a PXI account?",
                a: "Download the PXI app and sign up with your email, Apple ID, or Google account. Verification takes a few seconds and you can join or create events straight away.",
            },
            {
                q: "I can't log in — what should I do?",
                a: "Try the 'Forgot password' link on the login screen. If you signed up with Apple or Google, make sure you're using the same provider. Still stuck? Email support@pxispace.com with your account email and we'll sort it out.",
            },
            {
                q: "How do I delete my account?",
                a: "Go to Settings → Account → Delete Account in the app. This permanently removes your profile, photos, and data. If you need help completing the process, email support@pxispace.com.",
            },
        ],
    },
    {
        heading: "Events & Albums",
        items: [
            {
                q: "How do I join an event?",
                a: "Tap the event link or QR code shared by the host, or search for the event by name in the app. Some events require a valid ticket for access — make sure you're checked in at the venue.",
            },
            {
                q: "Why can't I see the event album?",
                a: "Album access is controlled by the host. Most albums unlock once you are checked in at the venue. Check that your location permissions are on and that you have the latest version of the app.",
            },
            {
                q: "How do I create and host an event?",
                a: "Tap the '+' button on the Events tab and follow the setup flow. You can set a venue, upload a cover photo, enable ticketing, and configure album permissions — all from the app.",
            },
            {
                q: "Can I download photos from an event?",
                a: "Yes. Open any photo in the album, tap the download icon, and it will save to your camera roll. Hosts can set download permissions, so if the option is greyed out the host has disabled it for that event.",
            },
        ],
    },
    {
        heading: "PXIClip Device",
        items: [
            {
                q: "How do I set up PXIClip?",
                a: "Charge PXIClip fully before first use. Open the PXI app, go to the Clip tab, and tap 'Connect Device'. Enable Bluetooth when prompted and hold PXIClip in pairing mode (hold the power button for 3 seconds). The app will find it automatically.",
            },
            {
                q: "PXIClip won't pair with my phone — how do I fix it?",
                a: "First, make sure Bluetooth is on and PXI has Bluetooth permission in your phone's settings. Force-close the app, restart PXIClip, and try again. If the issue persists, forget the device in your Bluetooth settings and re-pair from scratch. Still not working? Email support@pxispace.com with your device serial number.",
            },
            {
                q: "What paper does PXIClip use?",
                a: "PXIClip uses standard 2×3 inch ZINK (Zero Ink) paper. We recommend using PXI-branded paper packs for the best colour accuracy and print life. Third-party ZINK paper also works in most cases.",
            },
            {
                q: "My prints are coming out faded or streaky — what's wrong?",
                a: "Faded prints are usually caused by low battery or paper loaded face-down. Make sure PXIClip is at least 50% charged and that the paper is loaded glossy-side up with the blue calibration sheet at the bottom of the stack.",
            },
        ],
    },
    {
        heading: "Tickets & Payments",
        items: [
            {
                q: "How do I buy a ticket?",
                a: "Find the event in the app or via a shared link, tap 'Get Tickets', choose your ticket type, and complete checkout with Apple Pay, Google Pay, or a card. Your ticket lives in the Tickets tab and can be shown at the door.",
            },
            {
                q: "I was charged but can't access the event — what do I do?",
                a: "Pull to refresh on the Tickets tab first, as the ticket can take a moment to appear. If it still isn't there after a minute, email support@pxispace.com with your order confirmation and we'll resolve it right away.",
            },
            {
                q: "How do host payouts work?",
                a: "Ticket revenue is processed through Stripe. Once your event closes, funds are transferred to your connected bank account on a standard Stripe payout schedule (usually 2–7 business days). For payout questions, email support@pxispace.com with your event name.",
            },
        ],
    },
    {
        heading: "Privacy & Safety",
        items: [
            {
                q: "How does Find My Shots (face matching) work?",
                a: "Find My Shots uses on-device face recognition to surface photos that include you from an event album. No biometric data is sent to our servers. You can turn the feature off at any time in Settings → Privacy.",
            },
            {
                q: "Is my data secure?",
                a: "Yes. PXI uses encrypted connections for all data in transit, session-based authentication, and strict access controls so event content is only visible to verified attendees. See our Privacy Policy for full details.",
            },
            {
                q: "How do I report a safety or trust issue?",
                a: "For content or behaviour that violates our community guidelines, use the in-app report button on any photo, profile, or event. For urgent trust and safety matters, email trust@pxispace.com directly.",
            },
        ],
    },
];

const FAQ = () => {
    const [open, setOpen] = useState(null);

    const toggle = (key) => setOpen(open === key ? null : key);

    return (
        <section id="faq" className="px-4 pb-20 lg:pb-28 scroll-mt-28">
            <div className="container mx-auto max-w-3xl space-y-10">
                {sections.map((section) => (
                    <div key={section.heading}>
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4">
                            {section.heading}
                        </h2>

                        <div className="space-y-2">
                            {section.items.map((f) => {
                                const key = `${section.heading}-${f.q}`;
                                const isOpen = open === key;
                                return (
                                    <div
                                        key={key}
                                        className="glass-card border border-transparent"
                                    >
                                        <button
                                            onClick={() => toggle(key)}
                                            className="w-full flex items-center justify-between p-4 text-left"
                                        >
                                            <span
                                                className={`font-medium text-sm ${isOpen ? "heading-gradient" : "text-white"}`}
                                            >
                                                {f.q}
                                            </span>
                                            <motion.div
                                                animate={{ rotate: isOpen ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="shrink-0 ml-4 text-purple-400"
                                            >
                                                <FiChevronDown size={16} />
                                            </motion.div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    key="content"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="px-4 pb-4 text-sm text-color-secondary leading-relaxed">
                                                        {f.a}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQ;
