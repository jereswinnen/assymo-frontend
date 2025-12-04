import { neon } from "@neondatabase/serverless";
import type {
  Appointment,
  AppointmentSettings,
  DateOverride,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateSettingsInput,
  CreateDateOverrideInput,
  AppointmentStatus,
} from "@/types/appointments";
import { generateEditToken } from "./utils";

const sql = neon(process.env.DATABASE_URL!);

// =============================================================================
// Appointment Settings (Weekly Schedule)
// =============================================================================

/**
 * Get all appointment settings (weekly schedule)
 */
export async function getAppointmentSettings(): Promise<AppointmentSettings[]> {
  const rows = await sql`
    SELECT
      id,
      day_of_week,
      is_open,
      open_time::text,
      close_time::text,
      slot_duration_minutes,
      created_at,
      updated_at
    FROM appointment_settings
    ORDER BY day_of_week
  `;

  return rows as AppointmentSettings[];
}

/**
 * Get settings for a specific day of the week
 */
export async function getSettingsForDay(
  dayOfWeek: number
): Promise<AppointmentSettings | null> {
  const rows = await sql`
    SELECT
      id,
      day_of_week,
      is_open,
      open_time::text,
      close_time::text,
      slot_duration_minutes,
      created_at,
      updated_at
    FROM appointment_settings
    WHERE day_of_week = ${dayOfWeek}
  `;

  return (rows[0] as AppointmentSettings) || null;
}

/**
 * Update settings for a day of the week
 */
export async function updateSettings(
  input: UpdateSettingsInput
): Promise<AppointmentSettings> {
  const rows = await sql`
    UPDATE appointment_settings
    SET
      is_open = ${input.is_open},
      open_time = ${input.open_time ?? null},
      close_time = ${input.close_time ?? null},
      slot_duration_minutes = ${input.slot_duration_minutes ?? 60},
      updated_at = NOW()
    WHERE day_of_week = ${input.day_of_week}
    RETURNING
      id,
      day_of_week,
      is_open,
      open_time::text,
      close_time::text,
      slot_duration_minutes,
      created_at,
      updated_at
  `;

  return rows[0] as AppointmentSettings;
}

// =============================================================================
// Date Overrides
// =============================================================================

/**
 * Get date overrides within a date range
 */
export async function getDateOverrides(
  startDate: string,
  endDate: string
): Promise<DateOverride[]> {
  const rows = await sql`
    SELECT
      id,
      date::text,
      is_closed,
      open_time::text,
      close_time::text,
      reason,
      created_at
    FROM appointment_date_overrides
    WHERE date >= ${startDate}::date AND date <= ${endDate}::date
    ORDER BY date
  `;

  return rows as DateOverride[];
}

/**
 * Get all date overrides (for admin)
 */
export async function getAllDateOverrides(): Promise<DateOverride[]> {
  const rows = await sql`
    SELECT
      id,
      date::text,
      is_closed,
      open_time::text,
      close_time::text,
      reason,
      created_at
    FROM appointment_date_overrides
    ORDER BY date DESC
  `;

  return rows as DateOverride[];
}

/**
 * Get override for a specific date
 */
export async function getDateOverride(
  date: string
): Promise<DateOverride | null> {
  const rows = await sql`
    SELECT
      id,
      date::text,
      is_closed,
      open_time::text,
      close_time::text,
      reason,
      created_at
    FROM appointment_date_overrides
    WHERE date = ${date}::date
  `;

  return (rows[0] as DateOverride) || null;
}

/**
 * Create a date override
 */
export async function createDateOverride(
  input: CreateDateOverrideInput
): Promise<DateOverride> {
  const rows = await sql`
    INSERT INTO appointment_date_overrides (date, is_closed, open_time, close_time, reason)
    VALUES (
      ${input.date}::date,
      ${input.is_closed},
      ${input.open_time ?? null},
      ${input.close_time ?? null},
      ${input.reason ?? null}
    )
    RETURNING
      id,
      date::text,
      is_closed,
      open_time::text,
      close_time::text,
      reason,
      created_at
  `;

  return rows[0] as DateOverride;
}

/**
 * Delete a date override
 */
export async function deleteDateOverride(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM appointment_date_overrides
    WHERE id = ${id}
    RETURNING id
  `;

  return result.length > 0;
}

// =============================================================================
// Appointments
// =============================================================================

/**
 * Get appointments within a date range
 */
export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string,
  status?: AppointmentStatus | "all"
): Promise<Appointment[]> {
  if (status && status !== "all") {
    const rows = await sql`
      SELECT
        id,
        appointment_date::text,
        appointment_time::text,
        duration_minutes,
        customer_name,
        customer_email,
        customer_phone,
        customer_street,
        customer_postal_code,
        customer_city,
        remarks,
        status,
        edit_token,
        admin_notes,
        ip_address,
        created_at,
        updated_at,
        cancelled_at
      FROM appointments
      WHERE appointment_date >= ${startDate}::date
        AND appointment_date <= ${endDate}::date
        AND status = ${status}
      ORDER BY appointment_date, appointment_time
    `;
    return rows as Appointment[];
  }

  const rows = await sql`
    SELECT
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
    FROM appointments
    WHERE appointment_date >= ${startDate}::date
      AND appointment_date <= ${endDate}::date
    ORDER BY appointment_date, appointment_time
  `;

  return rows as Appointment[];
}

/**
 * Get all appointments (for admin, with optional filters)
 */
export async function getAllAppointments(
  limit = 100,
  offset = 0
): Promise<Appointment[]> {
  const rows = await sql`
    SELECT
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
    FROM appointments
    ORDER BY appointment_date DESC, appointment_time DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return rows as Appointment[];
}

/**
 * Get a single appointment by ID
 */
export async function getAppointmentById(
  id: number
): Promise<Appointment | null> {
  const rows = await sql`
    SELECT
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
    FROM appointments
    WHERE id = ${id}
  `;

  return (rows[0] as Appointment) || null;
}

/**
 * Get a single appointment by edit token (for public access)
 */
export async function getAppointmentByToken(
  token: string
): Promise<Appointment | null> {
  const rows = await sql`
    SELECT
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
    FROM appointments
    WHERE edit_token = ${token}
  `;

  return (rows[0] as Appointment) || null;
}

/**
 * Check if a time slot is already booked
 */
export async function isSlotBooked(
  date: string,
  time: string
): Promise<boolean> {
  const rows = await sql`
    SELECT id FROM appointments
    WHERE appointment_date = ${date}::date
      AND appointment_time = ${time}::time
      AND status != 'cancelled'
    LIMIT 1
  `;

  return rows.length > 0;
}

/**
 * Get booked slots for a date
 */
export async function getBookedSlots(date: string): Promise<string[]> {
  const rows = await sql`
    SELECT appointment_time::text as time
    FROM appointments
    WHERE appointment_date = ${date}::date
      AND status != 'cancelled'
  `;

  return rows.map((row) => (row as { time: string }).time);
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  input: CreateAppointmentInput,
  ipAddress?: string
): Promise<Appointment> {
  const editToken = generateEditToken();

  const rows = await sql`
    INSERT INTO appointments (
      appointment_date,
      appointment_time,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      edit_token,
      ip_address
    )
    VALUES (
      ${input.appointment_date}::date,
      ${input.appointment_time}::time,
      60,
      ${input.customer_name},
      ${input.customer_email},
      ${input.customer_phone},
      ${input.customer_street},
      ${input.customer_postal_code},
      ${input.customer_city},
      ${input.remarks ?? null},
      ${editToken},
      ${ipAddress ?? null}
    )
    RETURNING
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
  `;

  return rows[0] as Appointment;
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  id: number,
  input: UpdateAppointmentInput
): Promise<Appointment | null> {
  // Build dynamic update - only update provided fields
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.appointment_date !== undefined) {
    updates.push("appointment_date = $1::date");
    values.push(input.appointment_date);
  }
  if (input.appointment_time !== undefined) {
    updates.push(`appointment_time = $${values.length + 1}::time`);
    values.push(input.appointment_time);
  }
  if (input.customer_name !== undefined) {
    updates.push(`customer_name = $${values.length + 1}`);
    values.push(input.customer_name);
  }
  if (input.customer_email !== undefined) {
    updates.push(`customer_email = $${values.length + 1}`);
    values.push(input.customer_email);
  }
  if (input.customer_phone !== undefined) {
    updates.push(`customer_phone = $${values.length + 1}`);
    values.push(input.customer_phone);
  }
  if (input.customer_street !== undefined) {
    updates.push(`customer_street = $${values.length + 1}`);
    values.push(input.customer_street);
  }
  if (input.customer_postal_code !== undefined) {
    updates.push(`customer_postal_code = $${values.length + 1}`);
    values.push(input.customer_postal_code);
  }
  if (input.customer_city !== undefined) {
    updates.push(`customer_city = $${values.length + 1}`);
    values.push(input.customer_city);
  }
  if (input.remarks !== undefined) {
    updates.push(`remarks = $${values.length + 1}`);
    values.push(input.remarks);
  }
  if (input.status !== undefined) {
    updates.push(`status = $${values.length + 1}`);
    values.push(input.status);
  }
  if (input.admin_notes !== undefined) {
    updates.push(`admin_notes = $${values.length + 1}`);
    values.push(input.admin_notes);
  }

  if (updates.length === 0) {
    return getAppointmentById(id);
  }

  // For simplicity, use individual field updates
  const rows = await sql`
    UPDATE appointments
    SET
      appointment_date = COALESCE(${input.appointment_date ?? null}::date, appointment_date),
      appointment_time = COALESCE(${input.appointment_time ?? null}::time, appointment_time),
      customer_name = COALESCE(${input.customer_name ?? null}, customer_name),
      customer_email = COALESCE(${input.customer_email ?? null}, customer_email),
      customer_phone = COALESCE(${input.customer_phone ?? null}, customer_phone),
      customer_street = COALESCE(${input.customer_street ?? null}, customer_street),
      customer_postal_code = COALESCE(${input.customer_postal_code ?? null}, customer_postal_code),
      customer_city = COALESCE(${input.customer_city ?? null}, customer_city),
      remarks = COALESCE(${input.remarks ?? null}, remarks),
      status = COALESCE(${input.status ?? null}, status),
      admin_notes = COALESCE(${input.admin_notes ?? null}, admin_notes),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
  `;

  return (rows[0] as Appointment) || null;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(id: number): Promise<Appointment | null> {
  const rows = await sql`
    UPDATE appointments
    SET
      status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
  `;

  return (rows[0] as Appointment) || null;
}

/**
 * Delete an appointment (hard delete - use cancelAppointment for soft delete)
 */
export async function deleteAppointment(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM appointments
    WHERE id = ${id}
    RETURNING id
  `;

  return result.length > 0;
}

/**
 * Search appointments by customer info
 */
export async function searchAppointments(
  query: string,
  limit = 50
): Promise<Appointment[]> {
  const searchPattern = `%${query}%`;

  const rows = await sql`
    SELECT
      id,
      appointment_date::text,
      appointment_time::text,
      duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      customer_street,
      customer_postal_code,
      customer_city,
      remarks,
      status,
      edit_token,
      admin_notes,
      ip_address,
      created_at,
      updated_at,
      cancelled_at
    FROM appointments
    WHERE
      customer_name ILIKE ${searchPattern}
      OR customer_email ILIKE ${searchPattern}
      OR customer_phone ILIKE ${searchPattern}
    ORDER BY appointment_date DESC, appointment_time DESC
    LIMIT ${limit}
  `;

  return rows as Appointment[];
}

/**
 * Get upcoming appointments count
 */
export async function getUpcomingAppointmentsCount(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as count
    FROM appointments
    WHERE appointment_date >= CURRENT_DATE
      AND status = 'confirmed'
  `;

  return Number((rows[0] as { count: string }).count);
}
