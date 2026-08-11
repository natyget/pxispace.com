import React from "react";
import {
    RiFilePaperLine,
    RiShieldCheckLine,
    RiTicketLine,
    RiLockLine,
} from "react-icons/ri";

// TermsOfService.jsx
// Tailwind v4 + React component implementing a dark neon, glassmorphism TOS page.

export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-primary mt-12 relative overflow-hidden py-16 px-3 md:px-6">
            {/* Subtle radial glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
                <div className="w-[1200px] h-[1200px] rounded-full bg-gradient-to-r from-pink-600/10 via-purple-600/8 to-cyan-400/6 blur-3xl opacity-60 transform translate-y-[-20%]" />
            </div>

            <div className="max-w-4xl mx-auto ">
                <header className="mb-20 text-center">
                    <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight heading-gradient">
                        Terms of Service (The Contract)
                    </h1>

                    <p className="mt-3 text-sm text-neutral-300/80  md:max-w-2xl md:mx-auto">
                         Terms of Service Last Updated: January
                        9, 2026 Entity: PXI LABS LLC
                    </p>
                </header>

                <article className="bg-black/40 border border-purple-500/20 backdrop-blur-md rounded-2xl p-4 md:p-10 ]">
                    {/* Section 1 */}
                    <Section
                        number={1}
                        title="Acceptance of Terms"
                        Icon={RiFilePaperLine}
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            By creating an account, accessing, or using
                            PXIStudio (the "Service"), you agree to be bound by
                            these Terms. The Service is operated by PXI LABS LLC
                            ("we," "us," or "PXI"), located at 5850 Town and
                            Country Blvd, Suite 403, Frisco, TX 75034.
                        </p>
                    </Section>

                    <Divider />

                    {/* Section 2 */}
                    <Section
                        number={2}
                        title={'The "Odyssey" Score & Gamification'}
                        Icon={RiShieldCheckLine}
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            The "Odyssey Score" is a utility metric designed to
                            reflect social activity. You acknowledge that:
                        </p>

                        <ul className="mt-3 ml-5 list-disc text-neutral-300/80 space-y-2">
                            <li>
                                <strong>No Value:</strong> The Score has no cash
                                value and is not a property right.
                            </li>
                            <li>
                                <strong>Adjustments:</strong> We may recalculate
                                or reset your score at any time due to technical
                                updates, blocking of users, or anti-fraud
                                measures.
                            </li>
                            <li>
                                <strong>Blocking:</strong> If you block another
                                user, interactions associated with that user may
                                be removed from your Score calculation.
                            </li>
                        </ul>
                    </Section>

                    <Divider />

                    {/* Section 3 */}
                    <Section
                        number={3}
                        title="Content Licensing & Privacy Modes"
                        Icon={RiLockLine}
                    >
                        <div className="mt-2">
                            <h4 className="text-sm font-semibold heading-gradient flex items-center gap-2">
                                Private Events
                            </h4>
                            <p className="mt-1 text-neutral-300/80 leading-6">
                                Content posted in "Private" albums is
                                encrypted/restricted to the guest list. PXI
                                claims no marketing rights over this content.
                            </p>

                            <h4 className="mt-4 text-sm font-semibold heading-gradient flex items-center gap-2">
                                Public Events (The "Town Square")
                            </h4>
                            <p className="mt-1 text-neutral-300/80 leading-6">
                                By posting to a Public Event, you grant PXI LABS
                                LLC and the Event Organizer a non-exclusive,
                                royalty-free, transferable license to use,
                                display, and perform that specific content for
                                marketing and promotional purposes (e.g., social
                                media ads, "Recap" videos).
                            </p>
                        </div>
                    </Section>

                    <Divider />

                    {/* Section 4 */}
                    <Section
                        number={4}
                        title="Event Tickets & Payments"
                        Icon={RiTicketLine}
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            <strong>Platform Role:</strong> PXI provides the
                            venue for Organizers to sell tickets. We are not the
                            organizer/creator of the event.
                        </p>

                        <p className="mt-3 text-neutral-300/80 leading-7">
                            <strong>Payments:</strong> Ticket transactions are
                            processed via Stripe.
                        </p>

                        <p className="mt-3 text-neutral-300/80 leading-7">
                            <strong>Fees:</strong> PXI charges a Platform Fee
                            ($0.99 flat per ticket from the organizer payout, plus a 5.49% buyer service fee) applied to the ticket
                            price.
                        </p>

                        <div className="mt-3">
                            <h4 className="text-sm font-semibold text-white">
                                Refunds:
                            </h4>

                            <p className="mt-2 text-neutral-300/80 leading-7">
                                Ticket refunds are at the sole discretion of the
                                Event Organizer.
                            </p>

                            <p className="mt-2 text-neutral-300/80 leading-7">
                                The PXI Platform Fee is strictly non-refundable,
                                even if the Event Organizer issues a refund for
                                the ticket price.
                            </p>
                        </div>
                    </Section>

                    <Divider />

                    {/* Section 5 */}
                    <Section
                        number={5}
                        title="SMS & Invitations"
                        Icon={RiShieldCheckLine}
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            The Service allows you to send invitations via your
                            device's native messaging system. You are the sender
                            of these messages. You represent that you have the
                            right to contact the recipients. PXI does not send
                            messages on your behalf and is not liable for
                            carrier fees or TCPA compliance regarding messages
                            you initiate.
                        </p>
                    </Section>

                    <Divider />

                    {/* Section 6 */}
                    <Section
                        number={6}
                        title="Biometric Data (Face Grouping)"
                        Icon={RiLockLine}
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            PXI uses on-device vector analysis to group photos.
                            We do not store your facial geometry on our servers.
                            All biometric matching occurs locally on your phone.
                        </p>
                    </Section>

                    <Divider />

                    {/* Section 7 */}
                    <Section
                        number={7}
                        title="Liability & Disclaimer"
                        Icon={RiFilePaperLine}
                    >
                        <div className="mt-2 bg-white/3 border border-white/6 rounded-md p-4">
                            <p className="text-neutral-200/85 leading-7 uppercase">
                                THE SERVICE IS PROVIDED "AS IS." TO THE MAXIMUM
                                EXTENT PERMITTED BY TEXAS LAW, PXI LABS LLC IS
                                NOT LIABLE FOR:
                            </p>
                        </div>

                        <ul className="mt-3 ml-5 list-disc text-neutral-300/80 space-y-2 uppercase">
                            <li>
                                ANY ACTIONS OR CONTENT OF OTHER USERS (INCLUDING
                                UNAUTHORIZED PHOTOS).
                            </li>
                            <li>
                                PERSONAL INJURY OR PROPERTY DAMAGE RESULTING
                                FROM ATTENDING REAL-WORLD EVENTS.
                            </li>
                            <li>EVENT CANCELLATIONS BY ORGANIZERS.</li>
                        </ul>
                    </Section>

                    <Divider />

                    {/* Section 8 */}
                    <Section
                        number={8}
                        title="Governing Law"
                        Icon={RiShieldCheckLine}
                    >
                        <p className="mt-2 text-neutral-300/80 leading-7">
                            These Terms are governed by the laws of the State of
                            Texas. Any dispute arising under these terms shall
                            be resolved exclusively in the state or federal
                            courts located in Collin County, Texas.
                        </p>
                    </Section>

                    <footer className="mt-8 text-sm text-center text-neutral-400/80">
                        If you have questions about these Terms, please contact{" "}
                        <a
                            href="mailto:contact@pxispace.com"
                            className="text-purple-400 hover:text-purple-300 font-semibold"
                        >
                            PXI LABS LLC
                        </a>
                        .
                    </footer>
                </article>
            </div>
        </main>
    );
}

function Section({ number, title, children, Icon }) {
    return (
        <section className="group py-6">
            <header className="flex items-center gap-4 ">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white/3 border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    {Icon ? (
                        <Icon className="text-pink-300 w-5 h-5" />
                    ) : (
                        <span className="text-pink-300">#</span>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold heading-gradient">
                        {number}. {title}
                    </h3>
                </div>
            </header>

            <div className="mt-3 transition-shadow duration-150  rounded-md p-3">
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
