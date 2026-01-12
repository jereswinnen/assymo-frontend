# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server with Turbopack (localhost:3000)
pnpm build            # Production build (runs tests first)
pnpm lint             # ESLint
pnpm test             # Run tests (watch mode)
pnpm test --run       # Run tests once
npx tsc --noEmit      # Type checking
```

## Git Commits

Use conventional commit prefixes:
- `fix:` - Bug fixes
- `feat:` - New features
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring without behavior change

## Architecture Overview

Next.js 16 application with a custom admin CMS, AI chatbot with RAG, and appointment booking system. Content is stored in Neon Postgres with images in Vercel Blob.

### Tech Stack
- **Framework**: Next.js 16 with App Router and Turbopack
- **Database**: Neon Postgres (serverless)
- **Storage**: Vercel Blob for images
- **AI**: OpenAI GPT via Vercel AI SDK with RAG
- **Auth**: Better Auth with TOTP and WebAuthn passkeys
- **UI**: Tailwind CSS v4, Radix UI primitives
- **Testing**: Vitest with React Testing Library

### Key Architecture Patterns

**Page Builder Pattern**: Pages and solutions use a `sections` JSONB array with typed section blocks. Section types are defined in `src/types/sections.ts` with factory functions for creating new sections.

**Content Data Flow**:
1. Admin edits content via `/admin/content/*` pages
2. API routes in `/api/admin/content/*` handle CRUD operations
3. Content stored in Postgres with sections as JSONB
4. Public pages fetch via `src/lib/content.ts` query functions
5. Images stored in Vercel Blob with alt text in `image_metadata` table

**Admin CMS Structure** (`src/app/admin/`):
- `content/pages/[id]` - Page editor with drag-drop sections
- `content/solutions/[id]` - Solution/realization editor
- `content/media` - Media library (Vercel Blob)
- `content/navigation` - Header/footer nav management
- `content/filters` - Solution filtering categories
- `appointments` - Appointment scheduling management
- `conversations` - Chatbot conversation viewer
- `emails` - Newsletter management

**Section Forms**: Each section type has a corresponding form component in `src/components/admin/section-forms/`. The `SectionForm.tsx` component routes to the appropriate form based on `_type`.

**Admin UI Strings**: All Dutch UI text is centralized in `src/config/strings.ts`. Use the `t()` helper for string access:
```typescript
import { t } from '@/config/strings';
t('admin.buttons.save')  // "Bewaren"
```
When building admin features, check `strings.ts` for existing keys before adding new ones. Add new strings to the appropriate category if needed. Standards: "Bewaren" for save (not "Opslaan"), "Versturen" for send.

**Multi-Site & Permissions** (`src/lib/permissions/`):
- Roles: `super_admin` > `admin` > `content_editor`
- Site-scoped features: pages, solutions, navigation, filters, media, parameters
- Global features: appointments, emails, conversations, settings, users, sites
- Use `useSiteContext()` hook for current site, `usePermissions()` for access checks

### AI Chatbot

The chatbot uses RAG with booking tools for appointment scheduling.

**Configuration** in `src/config/chatbot.ts`:
- Model, rate limits, system prompt (Dutch)
- Suggested questions for empty chat state

**Booking Tools** in `src/lib/chatbot/booking-tools.ts`:
- `checkAvailability` - Shows available appointment slots
- `createAppointment` - Books an appointment

**RAG Pipeline**:
1. PDF documents uploaded via admin → parsed and chunked
2. Chunks embedded with OpenAI embeddings → stored in Postgres with pgvector
3. User queries retrieve relevant chunks via `src/lib/retrieval.ts`

### Appointments Module

Self-contained in `src/lib/appointments/`:
- `queries.ts` - Database operations
- `availability.ts` - Slot calculation logic
- `email.ts` - Confirmation/reminder emails
- `ics.ts` - Calendar file generation
- `utils.ts` - Validation and formatting

API routes handle public booking (`/api/appointments`) and admin management (`/api/admin/appointments`).

### Auth Flow

Better Auth with Postgres adapter. Admin-only (sign-up disabled).

**Login flow**:
1. Email/password → inline TOTP if enabled
2. First login → MFA choice page (setup 2FA, passkey, or skip)
3. Returning users can use passkey autofill

Key files: `src/lib/auth.ts` (server), `src/lib/auth-client.ts` (client)

### Testing

Tests run before every Vercel deploy (`pnpm build` runs tests first).

**Test location**: Co-located with source files using `.test.ts` suffix.

**Current coverage**:
- `src/lib/utils.ts` - Class merging
- `src/lib/appointments/utils.ts` - Validation, time slots, date formatting
- `src/lib/appointments/ics.ts` - Calendar file generation
- `src/lib/format.ts` - Formatting utilities

### Environment Variables

Required:
- `DATABASE_URL` - Neon Postgres connection string
- `OPENAI_API_KEY` - For embeddings and chat
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage
- `RESEND_API_KEY` - Email sending
- `BETTER_AUTH_SECRET` - Auth session encryption
