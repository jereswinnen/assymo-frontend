/**
 * Resend Email Configuration
 *
 * Centralized configuration for email services via Resend.
 * Modify these values to adjust email behavior.
 */

export const RESEND_CONFIG = {
  /**
   * Default sender address for general emails
   * Format: "Name <email@domain.com>"
   */
  fromAddress: "Assymo <info@assymo.be>",

  /**
   * Sender address for contact form notifications
   */
  fromAddressContact: "Assymo Contact <info@assymo.be>",

  /**
   * Sender address for newsletter emails
   */
  fromAddressNewsletter: "Assymo Nieuwsbrief <info@assymo.be>",

  /**
   * Recipient address for contact form submissions
   */
  contactRecipient: "info@assymo.be",

  /**
   * Default recipient for test newsletters
   */
  testEmail: "info@assymo.be",

  /**
   * Resend Audience ID for newsletter subscribers
   * Create an audience in Resend dashboard and add the ID here
   */
  audienceId: process.env.RESEND_AUDIENCE_ID || "",

  /**
   * Email subjects (Dutch)
   */
  subjects: {
    contactAlgemeen: "Nieuw contactformulier: Algemeen",
    contactTuinhuizen: "Nieuw contactformulier: Tuinhuizen",
    newsletterWelcome: "Welkom bij de Assymo nieuwsbrief!",
  },
} as const;
