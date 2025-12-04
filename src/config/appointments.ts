/**
 * Appointments Configuration
 *
 * Centralized configuration for the appointment booking system.
 */

export const APPOINTMENTS_CONFIG = {
  /**
   * Store address for calendar events and emails
   */
  storeAddress: "Eikenlei 159, 2960 Brecht",

  /**
   * Store name for display
   */
  storeName: "Assymo",

  /**
   * Full location string for calendar events
   */
  get storeLocation() {
    return `${this.storeName}, ${this.storeAddress}`;
  },

  /**
   * Default slot duration in minutes
   */
  defaultSlotDuration: 60,

  /**
   * How many days ahead users can book
   */
  maxDaysAhead: 60,

  /**
   * Minimum hours before appointment for booking/changes
   * (e.g., 24 = must book at least 24 hours in advance)
   */
  minHoursBeforeBooking: 0,
} as const;
