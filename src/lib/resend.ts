import { Resend } from "resend";

/**
 * Resend client instance
 *
 * Used for sending emails, managing contacts, and accessing the Resend API.
 * Requires RESEND_API_KEY environment variable.
 */
export const resend = new Resend(process.env.RESEND_API_KEY);
