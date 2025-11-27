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
- Newsletter broadcast composer

#### EmailLogs.tsx
Features:
- Fetch recent emails via Resend API (`resend.emails.list()`)
- Display: recipient, subject, status, timestamp
- Status badges (delivered, bounced, opened, clicked)
- Pagination or "load more"

#### TestEmailSender.tsx
Features:
- Input for recipient email
- Select template from Resend dashboard templates
- Send button
- Result feedback

#### NewsletterComposer.tsx
Features:
- **Template selector**: Dropdown of templates from Resend (`resend.templates.list()`)
- **Dynamic variable form**: Fetches template details (`resend.templates.get()`) to show required variables
- **Variable inputs**: Text fields for each template variable (e.g., `HEADLINE`, `CONTENT`, `CTA_URL`)
- **Subject input**: Override or use template default
- **Preview**: Show how the email will look with filled-in variables
- **Test send**: Send to your own email first
- **Confirmation dialog**: "Send to X subscribers?" before broadcasting
- **Send broadcast**: `resend.broadcasts.create()` to all newsletter subscribers

Example workflow:
1. Create "Monthly Newsletter" template in Resend with variables: `{{{HEADLINE}}}`, `{{{INTRO}}}`, `{{{CTA_TEXT}}}`, `{{{CTA_URL}}}`
2. In admin, select "Monthly Newsletter" template
3. Fill in: Headline = "Winterkorting!", Intro = "...", CTA = "Bekijk aanbiedingen"
4. Preview → Test send → Confirm → Broadcast to all subscribers

### 4.3 Create Admin Email API Routes

**File**: `src/app/api/admin/emails/route.ts`
- GET: List recent emails from Resend

**File**: `src/app/api/admin/emails/test/route.ts`
- POST: Send test email to single recipient

**File**: `src/app/api/admin/templates/route.ts`
- GET: List available templates from Resend (`resend.templates.list()`)

**File**: `src/app/api/admin/templates/[id]/route.ts`
- GET: Get template details including variables (`resend.templates.get()`)

**File**: `src/app/api/admin/broadcast/route.ts`
- POST: Send broadcast to all subscribers (`resend.broadcasts.create()`)

**File**: `src/app/api/admin/contacts/route.ts`
- GET: List newsletter contacts (for subscriber count and debugging)

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
│   │   └── NewsletterComposer.tsx  # Template selector + variable form
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
│   │       ├── templates/
│   │       │   ├── route.ts        # List templates
│   │       │   └── [id]/route.ts   # Get template details
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

### Send Email with Dashboard Template
```typescript
const { data, error } = await resend.emails.send({
  from: "Assymo <info@assymo.be>",
  to: [email],
  template: {
    id: "tmpl_xxxxxx", // Template ID from Resend dashboard
    variables: {
      PRODUCT_NAME: "Tuinhuis",
      PRICE: 1500,
    },
  },
});
```

---

## Resend Dashboard Templates

An alternative to React Email code templates - create and edit emails visually in the Resend dashboard.

### Creating Templates
1. Go to [resend.com/templates](https://resend.com/templates)
2. Click "Create template"
3. Use the visual drag-and-drop editor
4. Add images (upload to Resend or use external URLs)
5. Add variables with `{{{VARIABLE_NAME}}}` syntax (max 20)
6. **Publish** the template (drafts cannot be sent)

### Using Variables
- Define variables in the template: `{{{PRODUCT_NAME}}}`
- Pass values when sending via `template.variables`
- Reserved names (auto-populated): `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`

### Benefits
- Edit emails without code deployments
- Visual editor with drag-and-drop
- Non-developers can update content
- Built-in image hosting
- Mobile/desktop preview

### When to Use
- **Dashboard templates**: Marketing emails, newsletters, welcome emails (content changes frequently)
- **React Email templates**: Transactional emails like contact form notifications (structured, rarely changes)

---

## Notes

- Emails can use either React Email templates (code) or Resend Dashboard templates (visual editor)
- Dutch language throughout all user-facing content
- Admin features require authentication (existing auth system)
- File attachments (grondplan) will be handled via Resend attachments API
- Consider rate limiting on newsletter subscribe endpoint
