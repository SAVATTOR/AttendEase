/**
 * Device-based login restriction utility.
 * Prevents different accounts from logging in on the same device within a cooldown period.
 */

const LAST_LOGIN_EMAIL_KEY = 'attendance_last_login_email';
const LAST_LOGIN_TIMESTAMP_KEY = 'attendance_last_login_timestamp';
const COOLDOWN_MINUTES = Number(import.meta.env.VITE_LOGIN_COOLDOWN_MINUTES) || 30;

export interface RestrictionCheckResult {
    allowed: boolean;
    remainingMinutes?: number;
}

/**
 * Checks if a login attempt is allowed based on the device restriction policy.
 * @param email The email attempting to log in.
 * @returns An object indicating if login is allowed, and remaining cooldown time if blocked.
 */
export function checkDeviceRestriction(email: string): RestrictionCheckResult {
    const lastEmail = localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    const lastTimestampStr = localStorage.getItem(LAST_LOGIN_TIMESTAMP_KEY);

    // No previous login on this device, allow
    if (!lastEmail || !lastTimestampStr) {
        return { allowed: true };
    }

    // Same account, always allow
    if (lastEmail.toLowerCase() === email.toLowerCase()) {
        return { allowed: true };
    }

    // Different account, check cooldown
    const lastTimestamp = parseInt(lastTimestampStr, 10);
    if (isNaN(lastTimestamp)) {
        // Invalid timestamp, allow and reset
        return { allowed: true };
    }

    const now = Date.now();
    const elapsedMinutes = (now - lastTimestamp) / (1000 * 60);

    if (elapsedMinutes >= COOLDOWN_MINUTES) {
        // Cooldown expired, allow
        return { allowed: true };
    }

    // Still in cooldown, block
    const remainingMinutes = Math.ceil(COOLDOWN_MINUTES - elapsedMinutes);
    return { allowed: false, remainingMinutes };
}

/**
 * Records a successful login for the device restriction policy.
 * @param email The email that successfully logged in.
 */
export function recordSuccessfulLogin(email: string): void {
    localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.toLowerCase());
    localStorage.setItem(LAST_LOGIN_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Clears the device restriction data (e.g., for testing or admin override).
 */
export function clearDeviceRestriction(): void {
    localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
    localStorage.removeItem(LAST_LOGIN_TIMESTAMP_KEY);
}
