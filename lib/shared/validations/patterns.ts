/** Must contain letters and at least one special character (e.g. @, _, ., -). */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._@-]+$/;


/** Letters (incl. accents/ñ), spaces, periods, apostrophes and hyphens only. No numbers. */
export const FULL_NAME_PATTERN = /^[A-Z][a-zA-Z -]*$/;

/** Gmail-only email check for account registration, profiles, and recovery. */
export const ACCOUNT_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;

/** Basic email check, used for students, profile and account recovery. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Format XX-00-000, e.g. CS-23-033. */
export const STUDENT_ID_PATTERN = /^[A-Z]{2}-\d{2}-\d{3}$/;
