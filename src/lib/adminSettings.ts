/**
 * Admin Settings - Client-side localStorage helpers
 *
 * These settings are stored in the browser's localStorage and are
 * only accessible on the client side. For server-side email routing
 * in development, see src/config/resend.ts
 */

import { DEFAULT_TEST_EMAIL } from "@/config/resend";

const STORAGE_KEY_TEST_EMAIL = "admin_test_email";

/**
 * Get the test email from localStorage, or return the default
 */
export function getTestEmail(): string {
  if (typeof window === "undefined") {
    return DEFAULT_TEST_EMAIL;
  }
  return localStorage.getItem(STORAGE_KEY_TEST_EMAIL) || DEFAULT_TEST_EMAIL;
}

/**
 * Save the test email to localStorage
 */
export function setTestEmail(email: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY_TEST_EMAIL, email);
}
