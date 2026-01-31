/**
 * Resend Email Configuration
 *
 * Centralized configuration for email services via Resend.
 *
 * Email routing overview:
 * ┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
 * │ Feature                         │ Dev (localhost)                 │ Production                      │
 * ├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
 * │ Newsletter                      │ Admin Settings (default below)  │ Actual subscribers              │
 * │ Contact form                    │ DEFAULT_TEST_EMAIL (automatic)  │ info@assymo.be                  │
 * │ Appointment - admin notification│ DEFAULT_TEST_EMAIL (automatic)  │ info@assymo.be                  │
 * │ Appointment - customer email    │ DEFAULT_TEST_EMAIL (automatic)  │ Actual customer email           │
 * │ Quote - admin notification      │ DEFAULT_TEST_EMAIL (automatic)  │ info@assymo.be                  │
 * │ Quote - customer email          │ DEFAULT_TEST_EMAIL (automatic)  │ Actual customer email           │
 * └─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
 *
 * Admin Settings (localStorage) only affects newsletter "Test versturen".
 * Other emails use automatic dev/prod switching via isTestMode.
 */

// Test mode: when true, server-side emails go to serverTestEmail
const TEST_MODE = process.env.NODE_ENV === "development";

// Default test email address
// Used by: server-side email routing (dev mode), admin Settings default, API fallbacks
export const DEFAULT_TEST_EMAIL = "assymo@jeremys.be";

export const RESEND_CONFIG = {
  // Default sender address for general emails
  fromAddress: "Assymo <info@assymo.be>",

  // Sender address for contact form notifications
  fromAddressContact: "Assymo Contact <info@assymo.be>",

  // Sender address for newsletter
  fromAddressNewsletter: "Assymo Nieuwsbrief <info@assymo.be>",

  // Sender address for appointment emails
  fromAddressAppointments: "Assymo Afspraken <info@assymo.be>",

  // Sender address for authentication emails
  fromAddressAuth: "Assymo Admin <noreply@assymo.be>",

  // Recipient address for contact form submissions
  contactRecipient: TEST_MODE ? DEFAULT_TEST_EMAIL : "info@assymo.be",

  // Recipient address for appointment notifications
  appointmentRecipient: TEST_MODE ? DEFAULT_TEST_EMAIL : "info@assymo.be",

  // Whether test mode is enabled (development environment)
  isTestMode: TEST_MODE,

  // Resend Audience ID for newsletter subscribers
  audienceId: process.env.RESEND_AUDIENCE_ID || "",

  // Recipient address for quote/configurator notifications
  quoteRecipient: TEST_MODE ? DEFAULT_TEST_EMAIL : "info@assymo.be",

  // Email subjects
  subjects: {
    contactAlgemeen: "Nieuw contactformulier: Algemeen",
    contactOfferte: "Nieuw contactformulier: Offerte aanvragen",
    newsletterWelcome: "Welkom bij de Assymo nieuwsbrief!",
    appointmentConfirmation: "Bevestiging afspraak bij Assymo",
    appointmentCancellation: "Uw afspraak bij Assymo is geannuleerd",
    appointmentUpdated: "Uw afspraak bij Assymo is gewijzigd",
    appointmentReminder: "Herinnering: uw afspraak bij Assymo morgen",
    appointmentAdmin: "Nieuwe afspraak ingepland",
    passwordReset: "Reset je wachtwoord - Assymo Admin",
    quoteCustomer: "Uw offerte aanvraag bij Assymo",
    quoteAdmin: "Nieuwe offerte aanvraag",
    quoteReminder: "Herinnering: plan uw vrijblijvend plaatsbezoek",
  },
} as const;
