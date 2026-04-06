'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  PXI_TESTFLIGHT_APP_URL,
  PXI_TESTFLIGHT_JOIN_URL,
} from '@/lib/appStoreLinks';
import styles from './IosBetaLanding.module.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const FAQ_ITEMS = [
  {
    id: 'safe',
    q: 'Is TestFlight safe?',
    a: 'Yes — published by Apple Inc. on the official App Store. Every major app uses it for beta testing.',
  },
  {
    id: 'pay',
    q: 'Do I need to pay for anything?',
    a: 'No. TestFlight is free, and PXI beta access is free. No credit card required.',
  },
  {
    id: 'find',
    q: "I installed TestFlight but can't find PXI.",
    a: 'You need to open your invite link after TestFlight is installed. Use the Step 2 button on this page, or tap the original link you were sent. PXI will appear inside TestFlight.',
  },
  {
    id: 'updates',
    q: 'Will I get automatic updates?',
    a: 'Yes. TestFlight notifies you when a new build is ready. You can also enable auto-updates inside the TestFlight app.',
  },
];

function AppleGlyph({ className }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04l-.07.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowGlyph({ className }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function IosBetaLanding() {
  const [step1Complete, setStep1Complete] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);
  const stepTimer = useRef(null);

  const advanceStep1 = useCallback(() => {
    if (step1Complete) return;
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = setTimeout(() => {
      setStep1Complete(true);
      stepTimer.current = null;
    }, 500);
  }, [step1Complete]);

  useEffect(() => {
    return () => {
      if (stepTimer.current) clearTimeout(stepTimer.current);
    };
  }, []);

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`${styles.betaRoot} ${jakarta.className}`}>
      <section className={styles.hero}>
        <p className={`${styles.eyebrow} ${styles.fu} ${styles.d1}`}>
          Beta Access
        </p>

        <h1 className={`${styles.title} ${styles.fu} ${styles.d2}`}>
          Get PXI
          <br />
          on your phone.
        </h1>

        <p className={`${styles.heroBody} ${styles.fu} ${styles.d3}`}>
          Apple requires one free app to install betas. Two steps, under a
          minute.
        </p>

        <div className={`${styles.steps} ${styles.fu} ${styles.d4}`}>
          <div
            className={`${styles.step} ${!step1Complete ? styles.stepActive : styles.stepDone}`}
          >
            <div
              className={`${styles.num} ${step1Complete ? styles.numCheck : styles.numOn}`}
            >
              {step1Complete ? '✓' : '1'}
            </div>
            <div className={styles.stepBody}>
              <h3>Download TestFlight</h3>
              <p>
                Apple&apos;s free beta platform — tap the button below to
                install it from the App Store.
              </p>
            </div>
          </div>
          <div
            className={`${styles.step} ${step1Complete ? styles.stepActive : ''}`}
          >
            <div
              className={`${styles.num} ${step1Complete ? styles.numOn : styles.numIdle}`}
            >
              2
            </div>
            <div className={styles.stepBody}>
              <h3>Install PXI</h3>
              <p>
                Return here and tap Step 2. Hit <strong>Start Testing</strong>{' '}
                inside TestFlight. Done.
              </p>
            </div>
          </div>
        </div>

        {!step1Complete ? (
          <>
            <a
              href={PXI_TESTFLIGHT_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btnWhite} ${styles.fu} ${styles.d5}`}
              onClick={advanceStep1}
            >
              <AppleGlyph />
              Step 1 — Get TestFlight (free)
            </a>
            <button
              type="button"
              className={`${styles.skip} ${styles.fu} ${styles.d6}`}
              onClick={advanceStep1}
            >
              Already have TestFlight? Skip to step 2 →
            </button>
          </>
        ) : (
          <a
            href={PXI_TESTFLIGHT_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.btnOutline} ${styles.fu} ${styles.d5}`}
          >
            Step 2 — Install PXI Beta
            <ArrowGlyph />
          </a>
        )}
      </section>

      <section className={styles.whySection}>
        <p className={`${styles.eyebrow} ${styles.fu} ${styles.d1}`}>
          Why two steps?
        </p>
        <h2 className={`${styles.fu} ${styles.d2}`}>
          TestFlight is Apple&apos;s official beta platform.
        </h2>
        <p className={`${styles.fu} ${styles.d3}`}>
          Apple doesn&apos;t allow pre-release apps to install directly from a
          link — every iOS beta goes through TestFlight, including apps from
          the biggest companies in the world. It&apos;s made by Apple and is on
          the App Store.
        </p>
        <p className={`${styles.fu} ${styles.d4}`}>
          You only set it up once. After that, PXI updates happen automatically.
        </p>

        <div className={`${styles.faq} ${styles.fu} ${styles.d5}`}>
          {FAQ_ITEMS.map((item) => {
            const open = openFaqId === item.id;
            return (
              <div
                key={item.id}
                className={`${styles.faqRow} ${open ? styles.faqRowOpen : ''}`}
              >
                <button
                  type="button"
                  className={styles.faqQ}
                  onClick={() => toggleFaq(item.id)}
                  aria-expanded={open}
                >
                  {item.q}
                  <span className={styles.faqPlus} aria-hidden>
                    +
                  </span>
                </button>
                <div className={styles.faqBody}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
