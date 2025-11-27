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

## Phase 2: Newsletter Integration

### 2.1 Create Newsletter API Route

**File**: `src/app/api/newsletter/subscribe/route.ts`

Functionality:
- Accept POST with email
- Validate email format
- Add contact to Resend audience via `resend.contacts.create()`
- Send welcome email (optional)
- Return success/error response

```typescript
// API: POST /api/newsletter/subscribe
// Body: { email: string }
// Response: { success: true } | { error: string }
```

### 2.2 Create Newsletter Subscription Component

**File**: `src/components/NewsletterForm.tsx`

Features:
- Client component with form state
- Email input validation
- Loading state during submission
- Success/error feedback (toast or inline message)
- Reusable across Footer and potentially other locations

### 2.3 Update Footer Component

**File**: `src/components/Footer.tsx`

Changes:
- Extract newsletter form to separate client component
- Import and use `NewsletterForm` component
- Keep Footer as server component for Sanity data fetching

### 2.4 Create Welcome Email Template

**File**: `src/emails/NewsletterWelcome.tsx`

Content (Dutch):
- Welcome message
- What to expect
- Assymo branding

---

## Phase 3: Contact Form Integration

### 3.1 Refactor Contact Form Component

**File**: `src/components/sections/ContactForm.tsx`

Refactoring goals:
- Use shadcn UI components (Input, Textarea, Button, Select)
- Use Field system from `@/components/ui/field`
- Make form fields configurable/easy to modify
- Improve type safety

New structure:
```typescript
// Define form fields as configuration
const FORM_FIELDS = {
  algemeen: [...],
  tuinhuizen: [...],
};

// Render fields dynamically
```

### 3.2 Add shadcn Select Component

```bash
pnpm dlx shadcn@latest add select
```

### 3.3 Update Contact API Route

**File**: `src/app/api/contact/route.ts`

Changes:
- Import Resend client and email templates
- On valid submission:
  1. Send notification email to info@assymo.be
  2. Set reply-to as customer's email
  3. Include all form data in email body
- Handle file uploads for Tuinhuizen (attach to email or upload separately)
- Return appropriate responses

### 3.4 Create Contact Form Email Templates

**File**: `src/emails/ContactFormEmail.tsx`

For "Algemeen" submissions:
- Customer details (name, email, phone, address)
- Message content
- Clean, readable layout

**File**: `src/emails/ContactFormTuinhuizenEmail.tsx`

For "Tuinhuizen" submissions:
- Customer details
- Tuinhuizen-specific fields (bouwType, houtsoort, profiel)
- Extra info
- Note about grondplan attachment

---

## Phase 4: Admin Panel Integration

### 4.1 Add Email Tab to Admin Dashboard

**File**: `src/app/admin/page.tsx`

Add third tab: "E-mails" alongside Conversations and Embeddings

### 4.2 Create Admin Email Components

**Directory**: `src/components/admin/`

#### EmailDashboard.tsx
Main container with sub-sections:
- Email logs
- Test email sender
- Broadcast sender

#### EmailLogs.tsx
Features:
- Fetch recent emails via Resend API (`resend.emails.list()`)
- Display: recipient, subject, status, timestamp
- Status badges (delivered, bounced, opened, clicked)
- Pagination or "load more"

#### TestEmailSender.tsx
Features:
- Input for recipient email
- Select template type
- Send button
- Result feedback

#### BroadcastSender.tsx
Features:
- Subject input
- Rich text or markdown content editor
- Preview functionality
- Confirmation dialog before sending
- Send to all newsletter subscribers

### 4.3 Create Admin Email API Routes

**File**: `src/app/api/admin/emails/route.ts`
- GET: List recent emails from Resend

**File**: `src/app/api/admin/emails/test/route.ts`
- POST: Send test email

**File**: `src/app/api/admin/broadcast/route.ts`
- POST: Send broadcast to all subscribers

**File**: `src/app/api/admin/contacts/route.ts`
- GET: List newsletter contacts (for reference/debugging)

---

## File Structure Summary

```
src/
├── config/
│   └── resend.ts              # Resend configuration
├── lib/
│   └── resend.ts              # Resend client instance
├── emails/                     # React Email templates
│   ├── ContactFormEmail.tsx
│   ├── ContactFormTuinhuizenEmail.tsx
│   ├── NewsletterWelcome.tsx
│   └── NewsletterBroadcast.tsx
├── components/
│   ├── NewsletterForm.tsx     # Newsletter subscription form
│   ├── Footer.tsx             # Updated to use NewsletterForm
│   ├── sections/
│   │   └── ContactForm.tsx    # Refactored contact form
│   ├── admin/
│   │   ├── EmailDashboard.tsx
│   │   ├── EmailLogs.tsx
│   │   ├── TestEmailSender.tsx
│   │   └── BroadcastSender.tsx
│   └── ui/
│       └── select.tsx         # New shadcn Select component
├── app/
│   ├── api/
│   │   ├── newsletter/
│   │   │   └── subscribe/route.ts
│   │   ├── contact/
│   │   │   └── route.ts       # Updated
│   │   └── admin/
│   │       ├── emails/
│   │       │   ├── route.ts
│   │       │   └── test/route.ts
│   │       ├── broadcast/route.ts
│   │       └── contacts/route.ts
│   └── admin/
│       └── page.tsx           # Updated with Email tab
```

---

## Implementation Order

1. **Phase 1**: Setup (config, client, install react-email)
2. **Phase 2**: Newsletter (API route, form component, Footer update)
3. **Phase 3**: Contact form (refactor, Select component, API update, templates)
4. **Phase 4**: Admin panel (tabs, email logs, test sender, broadcast)

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

- All emails use React Email templates for maintainability
- Dutch language throughout all user-facing content
- Admin features require authentication (existing auth system)
- File attachments (grondplan) will be handled via Resend attachments API
- Consider rate limiting on newsletter subscribe endpoint
