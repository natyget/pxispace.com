export const PROFILE_USERNAME_MIN_LENGTH = 1;
export const PROFILE_USERNAME_MAX_LENGTH = 30;

/** Lowercase a-z, 0-9, ., _ — no leading/trailing ., no .. */
export const USERNAME_REGEX = /^(?!.*\.\.)[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/;

export const USERNAME_RULES_HINT =
    '1–30 characters: lowercase letters, digits, periods, and underscores only. No periods at the start or end, or double periods.';

export function isValidUsername(username) {
    return (
        username.length >= PROFILE_USERNAME_MIN_LENGTH &&
        username.length <= PROFILE_USERNAME_MAX_LENGTH &&
        USERNAME_REGEX.test(username)
    );
}

export function sanitizeUsernameInput(text) {
    return text.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, PROFILE_USERNAME_MAX_LENGTH);
}
