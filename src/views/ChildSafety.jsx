import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon } from '@hugeicons/core-free-icons';
import Link from 'next/link';

function Section({ title, children, highlight }) {
  return (
    <div
      className={
        highlight
          ? 'bg-red-900/20 border border-red-900/50 p-6 md:p-8 rounded-2xl'
          : 'border-b border-white/8 pb-10'
      }
    >
      <h2 className={`text-xl md:text-2xl font-bold mb-4 ${highlight ? 'text-red-400' : 'text-white'}`}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ChildSafety() {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden py-16 px-4 md:px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-r from-red-900/10 via-purple-900/8 to-transparent blur-3xl opacity-60 translate-y-[-20%]" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-900/30 border border-red-900/50 mb-6">
            <HugeiconsIcon icon={Shield01Icon} className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Child Safety Standards
          </h1>
          <p className="text-sm text-white/50 font-mono uppercase tracking-widest">
            PXI LABS LLC · Updated May 2026
          </p>
        </header>

        <article className="space-y-10">
          <Section highlight title="Zero Tolerance for CSAE">
            <p className="text-red-200/80 leading-relaxed mb-4">
              PXI Studio has an absolute zero-tolerance policy toward child sexual abuse and exploitation
              (CSAE) in any form. This includes child sexual abuse material (CSAM), grooming, solicitation
              of minors, and the facilitation of any activity that sexually exploits or endangers children.
            </p>
            <p className="text-red-200/80 leading-relaxed">
              Any content or behaviour that violates this policy results in immediate account termination,
              content removal, and mandatory reporting to the{' '}
              <strong className="text-white">National Center for Missing &amp; Exploited Children (NCMEC)
              CyberTipline</strong> and relevant law enforcement authorities.
            </p>
          </Section>

          <Section title="In-App Reporting">
            <p className="text-white/70 leading-relaxed">
              Every user profile, photo, and piece of content on PXI Studio has a built-in{' '}
              <strong className="text-white">Report</strong> button (tap the ••• menu or long-press any
              content). Users can report child safety concerns at any time, with no account required to
              view the reporting flow.
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-white/70">
              <li>Reports are reviewed by PXI's Trust &amp; Safety team within 24 hours.</li>
              <li>Zero-tolerance violations (CSAM, grooming) are acted upon immediately upon detection.</li>
              <li>
                You may also report directly by email:{' '}
                <a href="mailto:trust@pxispace.com" className="text-purple-400 underline">
                  trust@pxispace.com
                </a>
              </li>
            </ul>
          </Section>

          <Section title="Moderation &amp; Enforcement">
            <p className="text-white/70 leading-relaxed mb-4">
              PXI applies proactive and reactive moderation to prevent child safety violations:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li>
                <strong className="text-white">Proactive detection:</strong> Automated scanning for known
                CSAM hashes (PhotoDNA / similar) is applied to all uploaded media.
              </li>
              <li>
                <strong className="text-white">Human review:</strong> Flagged content is reviewed by Trust
                &amp; Safety personnel before reinstatement decisions are made.
              </li>
              <li>
                <strong className="text-white">Immediate removal:</strong> Content found to be CSAM or
                in violation of child safety standards is removed without appeal.
              </li>
              <li>
                <strong className="text-white">Permanent ban:</strong> Accounts confirmed to have uploaded
                or solicited CSAM are permanently terminated and device-fingerprinted to prevent re-registration.
              </li>
            </ul>
          </Section>

          <Section title="Age Eligibility &amp; Verification">
            <p className="text-white/70 leading-relaxed">
              PXI Studio requires all users to be at least <strong className="text-white">16 years old</strong>.
              Date of birth is collected and verified at account creation. Users aged 16–17 require
              parental or guardian consent. We do not knowingly allow children under 16 to create accounts;
              if we become aware of such an account it is immediately suspended and the data deleted.
            </p>
          </Section>

          <Section title="Legal Compliance &amp; Law Enforcement Cooperation">
            <p className="text-white/70 leading-relaxed mb-4">
              PXI LABS LLC complies with all applicable federal, state, and international child safety laws,
              including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li>18 U.S.C. § 2258A — mandatory reporting of apparent CSAM to NCMEC</li>
              <li>PROTECT Our Children Act</li>
              <li>COPPA (Children's Online Privacy Protection Act)</li>
              <li>UK Online Safety Act provisions relating to child safety</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              We cooperate fully with law enforcement investigations relating to child exploitation, and
              we preserve relevant evidence upon receipt of a valid legal process request.
            </p>
          </Section>

          <Section title="Data &amp; Privacy for Minors">
            <p className="text-white/70 leading-relaxed">
              PXI does not collect, store, or monetise the personal data of users under 16.
              Biometric features (facial recognition) require explicit opt-in and are never activated for
              minor accounts. No advertising targeting is applied to any minor's account.
            </p>
          </Section>

          <Section title="Contact — Designated Point of Contact">
            <p className="text-white/70 leading-relaxed">
              The designated contact for child safety inquiries, CSAE compliance questions, and law
              enforcement liaison is:
            </p>
            <div className="mt-4 p-5 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-white/80 space-y-1">
              <p>PXI LABS LLC</p>
              <p>
                Email:{' '}
                <a href="mailto:natan@pxispace.com" className="text-purple-400 underline">
                  natan@pxispace.com
                </a>
              </p>
              <p>Trust &amp; Safety:{' '}
                <a href="mailto:trust@pxispace.com" className="text-purple-400 underline">
                  trust@pxispace.com
                </a>
              </p>
              <p>5850 Town and Country Blvd, Suite 403, Frisco, TX 75034</p>
            </div>
          </Section>

          {/* Back link */}
          <div className="pt-4">
            <Link href="/legal" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              ← Back to Legal Hub
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
