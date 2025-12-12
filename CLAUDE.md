# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server with Turbopack (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint
pnpm test             # Run tests (watch mode)
pnpm test --run       # Run tests once
npx tsc --noEmit      # Type checking
```

## Architecture Overview

This is a Next.js 15.3.2 application using App Router with Sanity CMS as the content backend, featuring an AI-powered chatbot with RAG (Retrieval-Augmented Generation) and an admin panel.

### Key Technologies
- **Framework**: Next.js 15.3.2 with App Router
- **Styling**: Tailwind CSS v4 with custom CSS using grid layouts
- **CMS**: Sanity with next-sanity integration
- **Database**: Neon Postgres (serverless)
- **AI**: OpenAI GPT models via Vercel AI SDK
- **UI Components**: Radix UI primitives with custom styling
- **Testing**: Vitest with React Testing Library
- **TypeScript**: Strict mode enabled
- **Font**: Instrument Sans from Google Fonts

### Project Structure

- **src/app/**: App Router pages and layouts
  - **`(site)/`**: Public-facing pages
    - Dynamic routes for solutions: `oplossingen/[slug]/`
    - Static pages: home, contact, over-ons (about), oplossingen (solutions list)
  - **`admin/`**: Admin dashboard for chatbot management
  - **`api/`**: API routes
    - `chat/`: AI chatbot endpoint with RAG
    - `admin/`: Admin endpoints (conversations, document upload, retrieval testing)
    - `cron/`: Scheduled tasks (chat cleanup)
    - `contact/`: Contact form submission
    - Rate limiting endpoints

- **src/components/**: Reusable React components
  - **Layout components**: Header, Footer, NavLinks
  - **Content components**: SolutionCard, SectionUSPs, SectionRenderer
  - **Section components**: TextCentered, TextLeftImageRight, TextRightImageLeft, ProductGrid, Map, ContactForm, Slideshow variants
  - **Chatbot components**: ChatbotWrapper, Chatbot
  - **Admin components**: ConversationList, ConversationDialog, DocumentEmbeddings
  - **UI primitives**: button, input, textarea, dialog, dropdown-menu, card, badge, alert, progress, spinner, sonner (toast)

- **src/sanity/**: Sanity CMS configuration
  - `client.ts`: Sanity client setup (project: naj44gzh, dataset: production)
  - `imageUrl.ts`: Sanity image URL builder

- **src/lib/**: Utility functions and core logic
  - `getPageMetadata.ts`: Dynamic metadata generation for pages
  - `utils.ts`: Tailwind class merging utilities
  - **Chatbot-related**:
    - `chatSession.ts`: Session management
    - `rateLimit.ts`: Rate limiting logic
    - `getRateLimit.ts`: Rate limit status retrieval
    - `rateLimitQueries.ts`: Database queries for rate limits
  - **RAG/Embeddings**:
    - `db.ts`: Database connection utilities
    - `documentProcessor.ts`: PDF parsing and text chunking
    - `embeddings.ts`: OpenAI embedding generation
    - `retrieval.ts`: Vector similarity search

- **src/config/**: Configuration files
  - `chatbot.ts`: Centralized chatbot configuration (model, rate limits, prompts)

- **src/hooks/**: Custom React hooks
  - `usePersistedChat.ts`: Chat persistence with localStorage
  - `usePersistedMessages.ts`: Message persistence
  - `useRateLimitCountdown.ts`: Rate limit countdown timer

- **src/types/**: TypeScript type definitions
  - `chat.ts`: Chat message types

### Sanity Content Types

The application fetches content from Sanity CMS with these main content types:
- **page**: General pages with title, body (Portable Text), and headerImage
- **solution**: Product/service solutions with name, slug, headerImage, and body
- **sections**: Modular page sections (text, images, grids, forms, maps, etc.)

### AI Chatbot Feature

The chatbot is an AI-powered customer service assistant for Assymo (Dutch garden buildings company).

**Key Features:**
- OpenAI GPT integration via Vercel AI SDK
- RAG (Retrieval-Augmented Generation) with vector embeddings
- Rate limiting (configurable per session)
- Message persistence in Neon Postgres
- Admin panel for viewing conversations and managing documents
- GDPR-compliant IP anonymization
- Automatic message cleanup (configurable retention period)

**Configuration:** All chatbot settings are centralized in `src/config/chatbot.ts`:
- Model selection (default: gpt-5-nano-2025-08-07)
- Rate limits (messages per window)
- System prompts (Dutch language)
- Message retention periods

**RAG Pipeline:**
1. Upload PDF documents via admin panel
2. Documents are parsed and chunked
3. Chunks are embedded using OpenAI embeddings
4. Stored in Neon Postgres with pgvector
5. User queries retrieve relevant chunks via vector similarity
6. Context is injected into the AI prompt

### Admin Authentication

Admin authentication uses Better Auth with multiple security layers:

**Auth Stack:**
- **Better Auth**: Core authentication library with Postgres adapter
- **Email/Password**: Primary login method (sign-up disabled, admins created via CLI)
- **Two-Factor (TOTP)**: Required for all users, setup enforced on first login
- **Passkeys**: Optional WebAuthn passkeys for passwordless login

**Auth Files:**
- `src/lib/auth.ts`: Server-side Better Auth configuration
- `src/lib/auth-client.ts`: Client-side auth with plugins
- `src/app/api/auth/[...all]/route.ts`: API route handler

**Auth Pages (`src/app/admin/auth/`):**
- `page.tsx`: Login with email/password, 2FA verification, forgot password
- `setup-2fa/page.tsx`: QR code setup, TOTP verification, backup codes
- `setup-passkey/page.tsx`: WebAuthn passkey registration
- `reset-password/page.tsx`: Password reset form

**Login Flow:**
1. User enters email/password
2. If 2FA enabled → inline TOTP verification
3. If no 2FA → redirect to `/admin/auth/setup-2fa`
4. If no passkey → redirect to `/admin/auth/setup-passkey`
5. Subsequent logins can use passkey directly

### Database Schema

**Neon Postgres tables:**
- `chat_conversations`: Stores all chat interactions
- `rate_limits`: Tracks usage per session
- `document_chunks`: Stores embedded document chunks with vector data
- `user`, `session`, `account`: Better Auth user tables
- `twoFactor`: TOTP secrets and backup codes
- `passkey`: WebAuthn credential storage

### Styling Approach

- Custom grid system using CSS variables (`--u-grid-columns`, `--u-grid-gap`)
- Responsive grid: 2 columns on mobile, 8 columns on desktop
- Custom spacing tokens: `container-sm` (1.4rem), `container-md` (3rem)
- Color scheme with accent colors: light (#22df90) and dark (#1f3632)
- Typography scale from h1-h4 with custom sizing and spacing
- Radix UI components with custom Tailwind styling

### Path Aliases

- `@/*` maps to `./src/*` for clean imports

### Environment Variables

Required environment variables:
- `DATABASE_URL`: Neon Postgres connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat
- Sanity configuration (in code, not env vars)

### Important Notes

- Images are served from Sanity CDN (cdn.sanity.io)
- All pages fetch fresh data on each request (no static generation)
- PortableText is used for rendering rich text content from Sanity
- The project uses strict TypeScript configuration
- API routes use edge runtime where applicable
- Rate limiting is session-based (not IP-based) for better UX
- All chatbot configuration is in `src/config/chatbot.ts` - modify there instead of hardcoding values

### Testing

Tests run automatically before every Vercel deploy. When adding or modifying utility functions, consider adding tests.

**Current test coverage:**
- `src/lib/utils.ts` - class merging utilities
- `src/lib/appointments/utils.ts` - validation, time slots, date formatting
- `src/lib/appointments/ics.ts` - calendar file generation

**When to write tests:**
- Adding new pure functions (validation, formatting, calculations)
- Modifying existing tested functions
- Fixing bugs (add a test that would have caught it)

**Test file location:** Place tests next to the source file with `.test.ts` suffix (e.g., `utils.ts` → `utils.test.ts`)