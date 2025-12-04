# Appointments Calendar - Implementation Plan

> Implementation status tracking for the appointment booking system.

## Overview

Complete appointment booking system for Assymo store visits with:
- Public booking form with date/time selection
- Admin management panel
- Email notifications (Resend) with .ics attachments
- User self-service (view/edit/cancel via secure links)

---

## Phase 1: Database & Core API Infrastructure
**Status: COMPLETED** (2025-12-04)

### 1.1 Database Setup
- [x] `src/lib/appointments/db-setup.ts` - SQL migration function

### 1.2 Core API Types & Utils
- [x] `src/types/appointments.ts` - TypeScript interfaces
- [x] `src/lib/appointments/utils.ts` - Helper functions

### 1.3 Database Queries
- [x] `src/lib/appointments/queries.ts` - Database query functions

### 1.4 Availability Logic
- [x] `src/lib/appointments/availability.ts` - Slot availability calculations

### Additional Files Created
- [x] `src/lib/appointments/index.ts` - Barrel export file

---

## Phase 2: Email System
**Status: COMPLETED** (2025-12-04)

### 2.1 ICS File Generation
- [x] `src/lib/appointments/ics.ts` - Generate .ics calendar files

### 2.2 Email Templates
- [x] `src/emails/AppointmentConfirmation.tsx` - Customer confirmation
- [x] `src/emails/AppointmentAdminNotification.tsx` - Admin notification
- [x] `src/emails/AppointmentCancellation.tsx` - Cancellation notice
- [x] `src/emails/AppointmentUpdated.tsx` - Update confirmation

### 2.3 Email Service
- [x] `src/lib/appointments/email.ts` - Email sending functions
- [x] Update `src/config/resend.ts` - Add appointment email config
- [x] Update `src/emails/index.ts` - Export new templates

---

## Phase 3: Public API Routes
**Status: COMPLETED** (2025-12-04)

### 3.1 Availability API
- [x] `src/app/api/appointments/availability/route.ts` - GET available slots for date range

### 3.2 Booking API
- [x] `src/app/api/appointments/route.ts` - POST to create new appointment

### 3.3 Appointment Management (Token-based)
- [x] `src/app/api/appointments/[token]/route.ts` - GET/PUT/DELETE for customer self-service

---

## Phase 4: Admin API Routes
**Status: COMPLETED** (2025-12-04)

### 4.1 Admin Appointments API
- [x] `src/app/api/admin/appointments/route.ts` - GET list/search, POST create
- [x] `src/app/api/admin/appointments/[id]/route.ts` - GET/PUT/DELETE single appointment

### 4.2 Admin Settings API
- [x] `src/app/api/admin/appointments/settings/route.ts` - GET/PUT/PATCH weekly schedule

### 4.3 Admin Date Overrides API
- [x] `src/app/api/admin/appointments/overrides/route.ts` - GET/POST/DELETE date overrides

---

## Phase 5: Admin UI Components
**Status: COMPLETED** (2025-12-04)

### 5.1 Appointments Tab
- [x] Update `src/app/admin/page.tsx` - Add "Afspraken" tab
- [x] `src/components/admin/AppointmentsDashboard.tsx`

### 5.2 Appointments List
- [x] `src/components/admin/AppointmentsList.tsx`
- [x] `src/components/admin/AppointmentDialog.tsx`

### 5.3 Settings Management
- [x] `src/components/admin/AppointmentSettings.tsx`

### 5.4 Date Overrides
- [x] `src/components/admin/DateOverrides.tsx`

### 5.5 Manual Appointment Creation
- [x] `src/components/admin/CreateAppointmentForm.tsx`

---

## Phase 6: Public Frontend Components
**Status: NOT STARTED**

### 6.1 Appointment Booking Form
- [ ] `src/components/appointments/AppointmentBookingForm.tsx`
- [ ] `src/components/appointments/DatePicker.tsx`
- [ ] `src/components/appointments/TimeSlotPicker.tsx`

### 6.2 Pages
- [ ] `src/app/(site)/afspraak/page.tsx` - Booking page
- [ ] `src/app/(site)/afspraak/[token]/page.tsx` - View/edit page
- [ ] `src/app/(site)/afspraak/bevestigd/page.tsx` - Confirmation
- [ ] `src/app/(site)/afspraak/geannuleerd/page.tsx` - Cancellation

---

## Phase 7: Integration & Polish
**Status: NOT STARTED**

- [ ] Navigation integration
- [ ] Form validation (Dutch messages)
- [ ] Rate limiting
- [ ] Accessibility & keyboard navigation
- [ ] Mobile responsiveness
- [ ] Error handling & edge cases

---

## Database Schema

**Note:** Week starts on Monday (day_of_week: 0=Monday, 6=Sunday). The frontend calendar should also display Monday as the first day of the week.

```sql
-- Appointment settings table (store availability configuration)
CREATE TABLE IF NOT EXISTS appointment_settings (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL, -- 0=Monday, 1=Tuesday, ..., 6=Sunday
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

-- Indexes
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_email_idx ON appointments(customer_email);
CREATE INDEX IF NOT EXISTS appointments_edit_token_idx ON appointments(edit_token);
```

---

## Dutch UI Text Reference

### Public Pages
- Page title: "Maak een afspraak"
- Date selection: "Kies een datum"
- Time selection: "Kies een tijdstip"
- Customer section: "Uw gegevens"
- Submit button: "Afspraak inplannen"

### Form Fields
- Naam, E-mailadres, Telefoonnummer
- Straat en huisnummer, Postcode, Plaats
- Opmerkingen (optional)

### Admin Panel
- Tab: "Afspraken"
- Sections: Overzicht, Instellingen, Geblokkeerde data
- Opening hours: "Openingsuren"
