# Resend Integration Plan

This document outlines the implementation plan for integrating Resend email services into the Assymo frontend.

## Overview

- **Newsletter**: Footer subscription adds contacts to Resend, enabling email marketing
- **Contact Form**: Send form submissions via Resend to info@assymo.be
- **Admin Panel**: Email logs, test emails, and broadcast functionality

## Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_AUDIENCE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Phase 1: General Resend Setup ✅ COMPLETE

### 1.1 Create Resend Configuration ✅

**File**: `src/config/resend.ts`

```typescript
export const RESEND_CONFIG = {
  fromAddress: "Assymo <info@assymo.be>",
  fromAddressContact: "Assymo Contact <info@assymo.be>",
  fromAddressNewsletter: "Assymo Nieuwsbrief <info@assymo.be>",
  contactRecipient: "info@assymo.be",
  testEmail: "info@assymo.be",  // Default recipient for test newsletters
  audienceId: process.env.RESEND_AUDIENCE_ID || "",
  subjects: {
    contactAlgemeen: "Nieuw contactformulier: Algemeen",
    contactTuinhuizen: "Nieuw contactformulier: Tuinhuizen",
    newsletterWelcome: "Welkom bij de Assymo nieuwsbrief!",
  },
} as const;
```

### 1.2 Create Resend Client ✅

**File**: `src/lib/resend.ts`

```typescript
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
```

### 1.3 Install React Email (for templates) ✅

```bash
pnpm add @react-email/components
```

### 1.4 Create Email Templates Directory ✅

**Directory**: `src/emails/`

Created templates:
- `components/EmailLayout.tsx` - Base layout component
- `ContactFormEmail.tsx` - For contact form notifications
- `ContactFormTuinhuizenEmail.tsx` - For Tuinhuizen-specific submissions
- `NewsletterWelcome.tsx` - Welcome email for new subscribers
- `NewsletterBroadcast.tsx` - For broadcast emails
- `index.ts` - Export barrel file

---

## Phase 2: Newsletter Integration ✅ COMPLETE

### 2.1 Create Newsletter API Route ✅

**File**: `src/app/api/newsletter/subscribe/route.ts`

Implemented:
- POST endpoint accepting JSON `{ email: string }`
- Email validation (format check)
- Adds contact to Resend audience via `resend.contacts.create()`
- Sends welcome email on successful subscription
- Handles "already subscribed" case gracefully
- Dutch error messages

### 2.2 Create Newsletter Subscription Component ✅

**File**: `src/components/NewsletterForm.tsx`

Implemented:
- Client component with form state
- Email input validation
- Loading state during submission
- Success/error/already-subscribed feedback (inline)
- Reusable via className prop

### 2.3 Update Footer Component ✅

**File**: `src/components/Footer.tsx`

Changes:
- Removed InputGroup imports (no longer needed)
- Imported and used `NewsletterForm` component
- Footer remains a server component for Sanity data fetching

### 2.4 Welcome Email Template ✅

**File**: `src/emails/NewsletterWelcome.tsx`

(Created in Phase 1)

---

## Phase 3: Contact Form Integration ✅ COMPLETE

### 3.1 Refactor Contact Form Component ✅

**File**: `src/components/sections/ContactForm.tsx`

Implemented:
- Refactored with shadcn UI components (Input, Textarea, Button, Select, Checkbox)
- Uses Field system from `@/components/ui/field` for consistent layout
- Centralized form state with typed `FormData` interface
- Generic `updateField` helper for type-safe state updates
- Loading/success states with spinner and icons

### 3.2 Add shadcn Select & Checkbox Components ✅

```bash
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add checkbox
```

### 3.3 Update Contact API Route ✅

**File**: `src/app/api/contact/route.ts`

Implemented:
- Imports Resend client and email templates
- Sends notification email to info@assymo.be via Resend
- Sets reply-to as customer's email (so you can reply directly)
- File attachments for Tuinhuizen (grondplan attached to email)
- Newsletter opt-in adds contact to Resend audience
- Dutch error messages

### 3.4 Contact Form Email Templates ✅

**File**: `src/emails/ContactFormEmail.tsx`

(Created in Phase 1) - For "Algemeen" submissions

**File**: `src/emails/ContactFormTuinhuizenEmail.tsx`

(Created in Phase 1) - For "Tuinhuizen" submissions with all specific fields

---

## Phase 4: Setup & Types ✅ COMPLETE

### 4.1 Database Setup ✅

Run this SQL in Neon console:

```sql
CREATE TABLE IF NOT EXISTS newsletters (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255),
  preheader VARCHAR(255),
  sections JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft',
  subscriber_count INT,
  resend_email_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);
```

### 4.2 Newsletter Types ✅

**File**: `src/config/newsletter.ts`

```typescript
export interface NewsletterSection {
  id: string;
  imageUrl?: string;
  title: string;
  text: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface Newsletter {
  id: number;
  subject: string;
  preheader?: string;
  sections: NewsletterSection[];
  status: "draft" | "sent";
  subscriberCount?: number;
  resendEmailId?: string;
  createdAt: Date;
  sentAt?: Date;
}
```

### 4.3 Newsletter Email Template ✅

**File**: `src/emails/NewsletterBroadcast.tsx`

React Email template rendering dynamic sections:
- Uses existing `EmailLayout` for header/footer/branding
- Maps over sections array
- Each section: optional image, title, text, optional CTA button

---

## Phase 5: Newsletter Composer ✅ COMPLETE

### 5.1 Add Email Tab to Admin Dashboard ✅

**File**: `src/app/admin/page.tsx`

Add third tab: "E-mails" alongside Conversations and Embeddings

### 5.2 EmailDashboard Component ✅

**File**: `src/components/admin/EmailDashboard.tsx`

Main container with two areas:
- Drafts list (left/top)
- Composer (right/bottom)

### 5.3 NewsletterComposer Component ✅

**File**: `src/components/admin/NewsletterComposer.tsx`

Section-based composer:

**Inputs:**
- Subject
- Preheader (optional)
- Sections (add/remove)
  - Image URL (optional)
  - Title
  - Text
  - CTA text + URL (optional)

**Actions:**
- [Save Draft] → creates/updates newsletter row
- [Send Test] → sends to admin email

### 5.4 Drafts API Routes ✅

**File**: `src/app/api/admin/newsletters/route.ts`
- GET: List drafts (`status = 'draft'`)
- POST: Create new draft

**File**: `src/app/api/admin/newsletters/[id]/route.ts`
- GET: Get single newsletter
- PUT: Update draft
- DELETE: Delete draft

**File**: `src/app/api/admin/newsletters/[id]/test/route.ts`
- POST: Send test email to single recipient

---

## Phase 6: Broadcasts & Stats ✅ COMPLETE

### 6.1 Subscriber Count Display ✅

**File**: `src/components/admin/EmailDashboard.tsx`

Implemented:
- Fetches subscriber count from Resend audience API
- Displays count at top of dashboard with icon
- Shows singular/plural form ("1 abonnee" / "X abonnees")

### 6.2 Send Broadcast ✅

**File**: `src/app/api/admin/newsletters/[id]/send/route.ts`

Implemented:
- POST endpoint to send newsletter to all subscribers
- Fetches newsletter from database
- Fetches contacts from Resend audience (filters out unsubscribed)
- Sends emails in batches of 100 (Resend limit)
- Updates newsletter: `status = 'sent'`, `subscriber_count`, `sent_at`, `resend_email_id`

**File**: `src/components/admin/NewsletterComposer.tsx`

- Added "Verstuur naar X abonnees" button
- Confirmation dialog before sending
- Saves draft before sending
- Success/error toast notifications

### 6.3 Broadcast History ✅

**File**: `src/components/admin/BroadcastHistory.tsx`

Implemented:
- Table displaying sent newsletters
- Shows: subject, sent date/time, subscriber count
- Link to view email in Resend dashboard
- Dutch formatting for dates

### 6.4 Stats API Route ✅

**File**: `src/app/api/admin/contacts/route.ts`

Implemented:
- GET endpoint returns subscriber count from Resend audience
- Filters out unsubscribed contacts

### 6.5 Custom Test Email (TODO)

Allow changing test email recipient in the admin UI:
- Show dialog when clicking "Test versturen" button
- Input field for email address (defaults to `RESEND_CONFIG.testEmail`)
- If the user changes the test email in the admin, make sure the RESEND_CONFIG.testEmail is also changed

---

## File Structure Summary

```
src/
├── config/
│   ├── resend.ts              # Resend configuration
│   ├── contactForm.ts         # Contact form field definitions
│   └── newsletter.ts          # Newsletter types
├── lib/
│   ├── resend.ts              # Resend client instance
│   └── db.ts                  # Neon DB connection (existing)
├── emails/
│   ├── components/
│   │   └── EmailLayout.tsx    # Base layout with Assymo branding
│   ├── ContactFormEmail.tsx
│   ├── ContactFormTuinhuizenEmail.tsx
│   ├── NewsletterWelcome.tsx
│   ├── NewsletterBroadcast.tsx  # Dynamic sections template
│   └── index.ts
├── components/
│   ├── NewsletterForm.tsx     # Newsletter subscription form
│   ├── Footer.tsx             # Uses NewsletterForm
│   ├── sections/
│   │   └── ContactForm.tsx    # Config-driven contact form
│   └── admin/
│       ├── EmailDashboard.tsx     # Main container
│       ├── NewsletterComposer.tsx # Section editor
│       └── BroadcastHistory.tsx   # Sent newsletters table
├── app/
│   ├── api/
│   │   ├── newsletter/
│   │   │   └── subscribe/route.ts
│   │   ├── contact/
│   │   │   └── route.ts
│   │   └── admin/
│   │       ├── contacts/route.ts          # GET subscriber count
│   │       └── newsletters/
│   │           ├── route.ts               # GET list, POST create
│   │           └── [id]/
│   │               ├── route.ts           # GET, PUT, DELETE
│   │               ├── test/route.ts      # POST send test
│   │               └── send/route.ts      # POST send broadcast
│   └── admin/
│       └── page.tsx           # With Email tab
```

### Database Table

```
newsletters
├── id (SERIAL PRIMARY KEY)
├── subject (VARCHAR 255)
├── preheader (VARCHAR 255)
├── sections (JSONB)
├── status (VARCHAR 20)        -- 'draft' or 'sent'
├── subscriber_count (INT)
├── resend_email_id (VARCHAR 255)
├── created_at (TIMESTAMP)
└── sent_at (TIMESTAMP)
```

---

## Implementation Order

1. **Phase 1**: Setup (config, client, install react-email) ✅
2. **Phase 2**: Newsletter subscription (API route, form component, Footer) ✅
3. **Phase 3**: Contact form (refactor, API update, templates) ✅
4. **Phase 4**: Setup & types (database table, newsletter config, email template) ✅
5. **Phase 5**: Newsletter composer (admin tab, drafts, test send) ✅
6. **Phase 6**: Broadcasts & stats (send to all, history, subscriber count) ✅

---

## Resend API Reference

### Send Email
```typescript
const { data, error } = await resend.emails.send({
  from: "Assymo <info@assymo.be>",
  to: ["info@assymo.be"],
  replyTo: "customer@example.com",
  subject: "New Contact Form Submission",
  react: ContactFormEmail({ name, email, message }),
});
```

### Add Contact to Audience
```typescript
const { data, error } = await resend.contacts.create({
  email: "subscriber@example.com",
  audienceId: RESEND_CONFIG.audienceId,
  unsubscribed: false,
});
```

### List Emails (Admin)
```typescript
const { data, error } = await resend.emails.list();
```

---

## Notes

- All emails use React Email templates (Resend only for sending/tracking)
- Single `newsletters` table handles both drafts and sent emails
- Broadcast stats viewed in Resend dashboard (linked from admin)
- Newsletter images should be hosted externally (Sanity CDN, Cloudinary, etc.)
- Dutch language throughout all user-facing content
- Admin features require authentication (existing auth system)
