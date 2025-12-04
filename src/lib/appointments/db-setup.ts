import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Setup appointment-related database tables
 *
 * This function creates the necessary tables for the appointment booking system:
 * - appointment_settings: Weekly schedule configuration
 * - appointment_date_overrides: Holiday/closure management
 * - appointments: Booking records
 *
 * Safe to run multiple times (uses IF NOT EXISTS and ON CONFLICT)
 */
export async function setupAppointmentTables() {
  try {
    // Create appointment_settings table (weekly schedule)
    await sql`
      CREATE TABLE IF NOT EXISTS appointment_settings (
        id SERIAL PRIMARY KEY,
        day_of_week INTEGER NOT NULL,
        is_open BOOLEAN NOT NULL DEFAULT false,
        open_time TIME,
        close_time TIME,
        slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day_of_week)
      )
    `;

    // Create appointment_date_overrides table (holidays, special closures)
    await sql`
      CREATE TABLE IF NOT EXISTS appointment_date_overrides (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        is_closed BOOLEAN NOT NULL DEFAULT true,
        open_time TIME,
        close_time TIME,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create appointments table
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_street VARCHAR(255) NOT NULL,
        customer_postal_code VARCHAR(20) NOT NULL,
        customer_city VARCHAR(100) NOT NULL,
        remarks TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        edit_token VARCHAR(64) NOT NULL UNIQUE,
        admin_notes TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TIMESTAMP,
        UNIQUE(appointment_date, appointment_time)
      )
    `;

    // Create indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS appointments_date_idx
      ON appointments(appointment_date)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS appointments_status_idx
      ON appointments(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS appointments_email_idx
      ON appointments(customer_email)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS appointments_edit_token_idx
      ON appointments(edit_token)
    `;

    // Insert default Dutch opening hours (Tuesday-Saturday 10:00-17:00)
    // Using ON CONFLICT to avoid duplicate errors on re-run
    const defaultSettings = [
      { day: 0, isOpen: false, open: null, close: null }, // Sunday - closed
      { day: 1, isOpen: false, open: null, close: null }, // Monday - closed
      { day: 2, isOpen: true, open: "10:00", close: "17:00" }, // Tuesday
      { day: 3, isOpen: true, open: "10:00", close: "17:00" }, // Wednesday
      { day: 4, isOpen: true, open: "10:00", close: "17:00" }, // Thursday
      { day: 5, isOpen: true, open: "10:00", close: "17:00" }, // Friday
      { day: 6, isOpen: true, open: "10:00", close: "17:00" }, // Saturday
    ];

    for (const setting of defaultSettings) {
      await sql`
        INSERT INTO appointment_settings (day_of_week, is_open, open_time, close_time, slot_duration_minutes)
        VALUES (${setting.day}, ${setting.isOpen}, ${setting.open}, ${setting.close}, 60)
        ON CONFLICT (day_of_week) DO NOTHING
      `;
    }

    console.log("✅ Appointment tables setup complete");
    return { success: true };
  } catch (error) {
    console.error("❌ Appointment tables setup error:", error);
    throw error;
  }
}

/**
 * Get raw SQL for manual database setup
 * Useful for running migrations outside of the application
 */
export function getAppointmentTablesSql(): string {
  return `
-- Appointment settings table (weekly schedule)
CREATE TABLE IF NOT EXISTS appointment_settings (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week)
);

-- Date-specific overrides (holidays, special closures)
CREATE TABLE IF NOT EXISTS appointment_date_overrides (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  is_closed BOOLEAN NOT NULL DEFAULT true,
  open_time TIME,
  close_time TIME,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_street VARCHAR(255) NOT NULL,
  customer_postal_code VARCHAR(20) NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  remarks TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  edit_token VARCHAR(64) NOT NULL UNIQUE,
  admin_notes TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  UNIQUE(appointment_date, appointment_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_email_idx ON appointments(customer_email);
CREATE INDEX IF NOT EXISTS appointments_edit_token_idx ON appointments(edit_token);

-- Insert default Dutch opening hours (Tuesday-Saturday 10:00-17:00)
INSERT INTO appointment_settings (day_of_week, is_open, open_time, close_time, slot_duration_minutes)
VALUES
  (0, false, NULL, NULL, 60),
  (1, false, NULL, NULL, 60),
  (2, true, '10:00', '17:00', 60),
  (3, true, '10:00', '17:00', 60),
  (4, true, '10:00', '17:00', 60),
  (5, true, '10:00', '17:00', 60),
  (6, true, '10:00', '17:00', 60)
ON CONFLICT (day_of_week) DO NOTHING;
  `.trim();
}
