'use client';

import { forwardRef } from 'react';

/**
 * One field of the login form, in the app's field look: a flat #2E2E2E box, radius 14, 56 tall, white 17px
 * semibold text, grey placeholder, purple caret and a 1.5px purple border while it has focus (red with an error).
 * `right` sits inside the box at the right edge (the password eye). The error is one line of red under the box.
 */
const AuthField = forwardRef(function AuthField({ error, right, className = '', id, ...rest }, ref) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`block h-14 w-full rounded-[14px] border-[1.5px] bg-pxi-field text-[17px] font-semibold text-white caret-pxi-purple outline-none placeholder:text-[#6E6E6E] ${
            error ? 'border-[#FF5B5B]' : 'border-transparent focus:border-pxi-purple'
          } ${right ? 'pl-4 pr-14' : 'px-4'} ${className}`}
          {...rest}
        />
        {right ? <div className="absolute inset-y-0 right-0 flex items-center">{right}</div> : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="ml-1 mt-1.5 text-[13px] font-semibold leading-[18px] text-[#FF5B5B]">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default AuthField;
