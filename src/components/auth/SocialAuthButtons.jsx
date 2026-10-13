'use client';

import { FaApple } from 'react-icons/fa';

// Brand rules. Google: white button, the four-colour G, "Continue with Google", dark grey text (#1F1F1F), Roboto
// medium. Apple: on our black page a white button with the black Apple logo, "Continue with Apple". Both are
// 48px tall pills the full width of the form column.
const BUTTON =
  'flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-white px-5 text-[16px] transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-45 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white';

function GoogleG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * @param {{ onGoogle: () => void, onApple: () => void, disabled?: boolean }} props
 */
export default function SocialAuthButtons({ onApple, onGoogle, disabled = false }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onApple}
        disabled={disabled}
        className={`${BUTTON} text-black`}
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif", fontWeight: 600 }}
      >
        <FaApple size={21} aria-hidden="true" className="-mt-0.5 text-black" />
        <span>Continue with Apple</span>
      </button>
      <button
        type="button"
        onClick={onGoogle}
        disabled={disabled}
        className={`${BUTTON} text-[#1F1F1F]`}
        style={{ fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif", fontWeight: 500 }}
      >
        <GoogleG />
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
