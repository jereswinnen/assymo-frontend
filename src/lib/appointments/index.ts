// Database setup
export { setupAppointmentTables, getAppointmentTablesSql } from "./db-setup";

// Query functions
export {
  // Settings
  getAppointmentSettings,
  getSettingsForDay,
  updateSettings,
  // Date overrides
  getDateOverrides,
  getAllDateOverrides,
  getDateOverride,
  createDateOverride,
  deleteDateOverride,
  // Appointments
  getAppointmentsByDateRange,
  getAllAppointments,
  getAppointmentById,
  getAppointmentByToken,
  isSlotBooked,
  getBookedSlots,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  searchAppointments,
  getUpcomingAppointmentsCount,
} from "./queries";

// Availability
export {
  getDaySchedule,
  getAvailableSlots,
  isSlotAvailable,
  getAvailability,
  getAvailableDates,
  getNextAvailableDate,
} from "./availability";

// Utilities
export {
  generateEditToken,
  formatDateNL,
  formatDateShortNL,
  formatTimeNL,
  formatDateTimeNL,
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  toDateString,
  isDateInPast,
  isToday,
  getCurrentTime,
  isTimeInPast,
  getDayOfWeek,
  getDateRange,
  formatAddress,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  normalizePostalCode,
} from "./utils";
