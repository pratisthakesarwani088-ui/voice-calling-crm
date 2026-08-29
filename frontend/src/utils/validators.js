/**
 * Client-side validation helpers.
 *
 * These mirror the backend's rules (see backend/app/utils/validators.py
 * and backend/app/schemas/auth.py) so the user gets instant feedback —
 * but the backend re-validates everything independently and is the
 * actual source of truth. Never trust client-side validation alone.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const DIGIT_RE = /\d/;
const SPECIAL_CHAR_RE = /[^\w\s]/;
const PHONE_RE = /^\+?[0-9()\-\s]{7,20}$/;
const PHONE_DIGITS_RE = /\d/g;

export const PASSWORD_MIN_LENGTH = 8;

export function isValidEmail(email) {
  return EMAIL_RE.test(email.trim());
}

/**
 * Mirrors backend/app/utils/validators.py:validate_phone — permissive
 * on formatting (digits plus +, spaces, hyphens, parentheses) but
 * requires at least 7 digits. Uniqueness is checked server-side only.
 */
export function isValidPhone(phone) {
  const trimmed = phone.trim();
  if (!trimmed || !PHONE_RE.test(trimmed)) return false;
  const digitCount = (trimmed.match(PHONE_DIGITS_RE) || []).length;
  return digitCount >= 7;
}

/**
 * Returns an array of human-readable problems with the password.
 * An empty array means the password is valid.
 */
export function getPasswordIssues(password) {
  const issues = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!UPPERCASE_RE.test(password)) {
    issues.push("One uppercase letter");
  }
  if (!LOWERCASE_RE.test(password)) {
    issues.push("One lowercase letter");
  }
  if (!DIGIT_RE.test(password)) {
    issues.push("One digit");
  }
  if (!SPECIAL_CHAR_RE.test(password)) {
    issues.push("One special character");
  }
  return issues;
}

export function isStrongPassword(password) {
  return getPasswordIssues(password).length === 0;
}

/**
 * Simple non-blank check used for required text fields across Product/
 * Knowledge Base forms (mirrors backend/app/utils/validators.py's
 * validate_required_text at the "is it blank" level — the backend is
 * still the source of truth for length limits).
 */
export function validateRequiredText(value) {
  return Boolean(value && value.trim());
}
