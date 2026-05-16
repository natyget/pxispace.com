import { HugeiconsIcon } from '@hugeicons/react';
import React from "react";
import { RiShieldCheckLine, RiLockLine, RiUserLine } from "react-icons/ri";
import { GoDatabase } from "react-icons/go";

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-primary mt-12 relative overflow-hidden py-16 px-3 md:px-6">
            <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
                <div className="w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-pink-600/8 via-purple-600/6 to-cyan-400/4 blur-3xl opacity-40 transform translate-y-[-15%]" />
            </div>

            <div className="max-w-4xl mx-auto">
                <header className="mb-20 text-center">
                    <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold heading-gradient">
                        Privacy Policy (The Data)
                    </h1>
                    <p className="mt-3 text-sm text-neutral-300/80 md:max-w-2xl md:mx-auto">
                        Privacy Policy Last Updated: January 9, 2026
                    </p>
                </header>

                <article className="bg-black/40 border border-purple-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-[0_6px_30px_rgba(139,92,246,0.08)]">
                    <Section id={1} Icon={GoDatabase} title="Data We Collect">
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Identity: Name, Email, Phone Number (for account
                            verification).
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Content: Photos and Videos you upload.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Usage Data: Interactions, event attendance (used to
                            calculate Odyssey Score).
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Contacts: Phone book access (hashed/anonymized) to
                            find friends.
                        </p>
                    </Section>

                    <Divider />

                    <Section
                        id={2}
                        Icon={RiLockLine}
                        title="How We Use Your Data"
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Service Delivery: To create your "PXI Passport" profile
                            and event feeds.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Biometrics: We use local Apple Vision/Android APIs
                            to match faces. This data remains on your device.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Location: We use location only while using the app
                            to verify you are at an event ("Geofencing") and to
                            suggest nearby parties. We do not track your
                            background location history.
                        </p>
                    </Section>

                    <Divider />

                    <Section
                        id={3}
                        Icon={RiShieldCheckLine}
                        title="Third-Party Sharing"
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Event Organizers: If you buy a ticket, we share your
                            Name and Ticket ID with the Organizer for check-in.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Stripe: Payment data is handled directly by Stripe;
                            PXI does not store full credit card numbers.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Legal: We may disclose data if compelled by a
                            subpoena or court order.
                        </p>
                    </Section>

                    <Divider />

                    <Section
                        id={4}
                        Icon={RiUserLine}
                        title="Your Rights (Deletion)"
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            You may delete your account at any time via
                            Settings.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Result: Your profile and Odyssey Score are
                            permanently removed.
                        </p>
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            Shared Content: Photos you contributed to other
                            users' Shared Albums may remain visible to them, but
                            your name/attribution will be anonymized.
                        </p>
                    </Section>

                    <Divider />

                    <Section id={5} Icon={RiShieldCheckLine} title="Children">
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            The Service is restricted to users 17 years of age
                            or older. We do not knowingly collect data from
                            minors.
                        </p>
                    </Section>

                    <Divider />

                    <Section id={6} Icon={RiShieldCheckLine} title="Contact Us">
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            For privacy concerns: PXI LABS LLC 5850 Town and
                            Country Blvd, Suite 403 Frisco, TX 75034 Email:{" "}
                            <a
                                href="mailto:contact@pxispace.com"
                                className="text-purple-400 font-semibold"
                            >
                                 contact@pxispace.com
                            </a>
                        </p>
                    </Section>

                    <footer className="mt-8 text-center text-sm text-neutral-400/80">
                        Your privacy matters. PXI is designed with privacy-first
                        principles.
                    </footer>
                </article>
            </div>
        </main>
    );
}

function Section({ id, Icon, title, children }) {
    return (
        <section className="group py-6" id={`privacy-${id}`}>
            <header className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white/3 border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    {Icon ? (
                        <HugeiconsIcon icon={Icon} className="text-pink-300 w-5 h-5" />
                    ) : (
                        <span className="text-pink-300">•</span>
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-semibold heading-gradient">
                        {title}
                    </h3>
                </div>
            </header>

            <div className="mt-3 rounded-md p-3  transition-shadow duration-150">
                {children}
            </div>
        </section>
    );
}

function Divider() {
    return (
        <div className="my-6 h-px w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 opacity-10 rounded" />
    );
}
