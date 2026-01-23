# Quote Wizard / Configurator

<objective>
Build a multi-site quote wizard at `/configurator` that guides users through configuring their custom outdoor structure (poolhouse, carport, guesthouse, etc.) and provides them with a rough price estimate. The wizard should integrate with the existing appointments system for optional booking and send quote emails via the existing email infrastructure. Admin management should integrate with the existing permissions system.
</objective>

<context>
<codebase_info>
- Next.js 16 with App Router and Turbopack
- Database: Neon Postgres with sections stored as JSONB
- Existing appointments module in `src/lib/appointments/` with availability checking and booking
- Email system using Resend with templates in `src/emails/`
- Contact form pattern in `src/components/forms/ContactForm.tsx` with config in `src/config/contactForm.ts`
- Section types defined in `src/types/sections.ts` with admin forms in `src/components/admin/section-forms/`
- Analytics via OpenPanel using `useTracking()` hook
- UI: Tailwind CSS v4, Radix UI primitives
- Dutch language UI (see `src/config/strings.ts`)
</codebase_info>

<multi_site_architecture>
- All content tables have `site_id` column for multi-site support
- VPG-frontend (sister site) fetches content from Assymo API
- Use `useSiteContext()` hook for current site in admin
- Configurator questions, pricing, and submissions should be site-scoped
- Public API endpoints should accept site parameter for cross-site fetching
</multi_site_architecture>

<permissions_system>
- Roles hierarchy: `super_admin` > `admin` > `content_editor`
- Site-scoped features use `usePermissions()` hook for access checks
- Configurator is a site-scoped feature (like pages, solutions, filters)
- Follow patterns from existing admin pages (e.g., `src/app/admin/content/pages/`)
- Check permissions before rendering admin UI and in API routes
</permissions_system>

<existing_products>
Products (solutions table):
- Poolhouses, Guesthouse, Tuinkamers, Tuinhuizen op maat
- Carports, Overdekkingen
- Bijgebouwen, Woninguitbreiding
- Poorten
- Various staircase types (Moderne/Klassieke/Hedendaagse/Cottage/Smeedwerk trappen)

Existing filter categories:
- Product: Poolhouse, Carports, Guesthouse, Tuinkamers, Poorten, etc.
- Stijl: Modern, Klassiek, Cottage, Hedendaags, Landelijk, Smeedwerk
- Materiaal: Eik, Beuk, Beton, Hout & Smeedijzer
- Uitvoering: Open, Gesloten, Recht, Zwevend, etc. (for staircases)
</existing_products>

<appointments_integration>
Existing availability API can be reused:
- `getAvailability(startDate, endDate)` returns dates with available slots
- `getAvailableSlots(date)` returns time slots for a date
- `POST /api/appointments` creates a booking
- See `src/lib/appointments/availability.ts` for implementation
</appointments_integration>
</context>

<requirements>
<functional>
1. **Wizard Flow** (3 steps with progress indicator):
   - Step 1: **Product Questions** - Select product category (pre-filled via URL param) + product-specific configuration questions (size, style, material, features)
   - Step 2: **Contact Details** - Name, email, phone, address, newsletter opt-in (similar to existing contact form pattern)
   - Step 3: **Summary & Quote** - Show configuration summary, rough price range, auto-sends quote email on load, optional appointment booking with available slots

2. **Product Configuration Questions** (admin-manageable per product):
   - Only product questions (step 1) are admin-manageable
   - Contact fields (step 2) are fixed - same as existing contact form
   - Summary step (step 3) is fixed - shows price + appointment integration
   - Questions definable per product category in admin
   - Support question types: single-select, multi-select, number input, dimensions (L x W x H)
   - Questions can affect price calculation
   - Some questions may be shared across products (e.g., style, material)

3. **Price Calculation**:
   - Rough price range (e.g., "€15.000 - €25.000") based on configuration
   - Clear disclaimer that this is an estimate, final price depends on site visit
   - Admin-configurable pricing rules per product/option combination
   - Base price + modifiers approach (e.g., base €10k, +€2k for oak material, +€500/m² for size)

4. **Appointment Integration**:
   - Optional: Book a consultation appointment from the summary step
   - Show next 3-5 available appointment slots (use existing availability API)
   - If booked, include configuration summary in appointment notes

5. **Email Flow**:
   - Auto-send quote email to user when reaching summary step (with configuration summary and price estimate)
   - Send notification email to Assymo with full details
   - If no appointment booked, include gentle reminder to schedule one in the email
   - New email template: `QuoteEmail.tsx`

6. **Entry Points**:
   - Direct URL: `/configurator`
   - From product pages: `/configurator?product=poolhouses` (pre-selects category)
   - Via CTA buttons in existing sections (no new section type needed, use existing button actions)

7. **Multi-Site Support**:
   - All configurator data (questions, pricing, submissions) scoped by `site_id`
   - Public API endpoints accept `?site=X` parameter for VPG-frontend to fetch
   - Each site can have different questions and pricing for same product categories
   - Quote submissions linked to originating site

8. **Admin Permissions**:
   - Configurator admin pages are site-scoped features
   - Use `usePermissions()` hook to check access (like other content features)
   - `content_editor` and above can manage questions and pricing
   - `admin` and above can view all submissions
   - API routes must verify permissions before mutations
</functional>

<technical>
1. **Database Schema** - New tables:
   ```sql
   -- Configurator questions (admin-manageable)
   CREATE TABLE configurator_questions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_slug TEXT, -- NULL = applies to all, or specific product slug
     question_key TEXT NOT NULL, -- e.g., 'size', 'style', 'material'
     label TEXT NOT NULL, -- Dutch label
     type TEXT NOT NULL, -- 'single-select' | 'multi-select' | 'number' | 'dimensions'
     options JSONB, -- For select types: [{value, label, priceModifier?}]
     required BOOLEAN DEFAULT true,
     order_rank INTEGER DEFAULT 0,
     site_id TEXT REFERENCES sites(id),
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- Base prices per product
   CREATE TABLE configurator_pricing (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_slug TEXT NOT NULL,
     base_price_min INTEGER NOT NULL, -- in cents
     base_price_max INTEGER NOT NULL, -- in cents
     price_modifiers JSONB, -- [{questionKey, optionValue, modifier}]
     site_id TEXT REFERENCES sites(id),
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(product_slug, site_id)
   );

   -- Quote submissions (for analytics/follow-up)
   CREATE TABLE quote_submissions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     configuration JSONB NOT NULL, -- Full wizard answers
     price_estimate_min INTEGER,
     price_estimate_max INTEGER,
     contact_name TEXT NOT NULL,
     contact_email TEXT NOT NULL,
     contact_phone TEXT,
     contact_address TEXT,
     appointment_id UUID REFERENCES appointments(id),
     site_id TEXT REFERENCES sites(id),
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **File Structure**:
   ```
   src/
   ├── app/
   │   ├── configurator/
   │   │   └── page.tsx              # Main wizard page (public)
   │   └── admin/
   │       └── content/
   │           └── configurator/
   │               ├── page.tsx      # Product questions list (follow filters/ pattern)
   │               ├── [productSlug]/
   │               │   └── page.tsx  # Questions for specific product
   │               ├── pricing/
   │               │   └── page.tsx  # Pricing per product (follow similar pattern)
   │               └── submissions/
   │                   └── page.tsx  # View quote submissions (admin+ only, read-only)
   ├── components/
   │   ├── configurator/
   │   │   ├── Wizard.tsx            # Main wizard container
   │   │   ├── ProgressBar.tsx       # 3-step progress indicator
   │   │   ├── steps/
   │   │   │   ├── ProductStep.tsx   # Product selection + admin-configured questions
   │   │   │   ├── ContactStep.tsx   # Fixed user details (reuse contact form pattern)
   │   │   │   └── SummaryStep.tsx   # Price + quote display + optional appointment
   │   │   └── QuestionField.tsx     # Renders question based on type
   │   └── admin/
   │       └── configurator/         # Admin-specific components (forms, tables)
   ├── lib/
   │   └── configurator/
   │       ├── queries.ts            # Database operations (site-scoped)
   │       ├── pricing.ts            # Price calculation logic
   │       └── types.ts              # TypeScript types
   ├── emails/
   │   └── QuoteEmail.tsx            # Quote confirmation email
   └── config/
       └── configurator.ts           # Fallback/default config if not in DB
   ```

3. **API Routes**:
   - `GET /api/configurator/questions?product=X&site=Y` - Get questions for product (public, site param for VPG)
   - `GET /api/configurator/pricing?product=X&site=Y` - Get pricing info (public)
   - `POST /api/configurator/calculate` - Calculate price estimate (public)
   - `POST /api/configurator/submit` - Submit quote, auto-sends email, optional appointment (public)
   - Admin CRUD routes under `/api/admin/configurator/` (with permission checks):
     - Questions: GET/POST/PUT/DELETE with `content_editor+` permission
     - Pricing: GET/POST/PUT/DELETE with `content_editor+` permission
     - Submissions: GET only with `admin+` permission
   - All admin routes use `useSiteContext()` pattern for site scoping

4. **State Management**:
   - Use React state or URL params to persist wizard progress
   - Consider `nuqs` for URL-synced state (already likely in project)

5. **Analytics Events**:
   - `configurator_started` - { product?: string } When wizard opens
   - `configurator_step_completed` - { step: 1|2|3, product: string }
   - `configurator_quote_sent` - { product, price_min, price_max } When reaching summary (auto-email)
   - `configurator_appointment_booked` - { product, date, time } When booking from wizard
   - `configurator_abandoned` - { step, product } On page unload if not completed
</technical>

<ui_ux>
1. **Visual Design**:
   - Clean, professional 3-step form
   - Progress bar showing: "1. Product → 2. Gegevens → 3. Offerte"
   - Mobile-friendly (responsive layout)
   - Match existing Assymo design language

2. **Step Transitions**:
   - Smooth transitions between steps
   - Back button to return to previous step
   - "Save and continue later" not required for MVP

3. **Step 1 - Product Questions** (admin-manageable):
   - Product category selector at top (dropdown or visual cards)
   - Once product selected, show relevant configuration questions below (fetched from admin-configured questions)
   - No price shown until summary step

4. **Step 2 - Contact Details** (fixed, not admin-manageable):
   - Reuse styling/pattern from existing contact form
   - Fixed fields: name, email, phone, address, newsletter opt-in checkbox
   - Same validation as contact form
   - Validate before allowing next step

5. **Step 3 - Summary & Quote** (fixed, not admin-manageable):
   - Show full configuration summary
   - Display price range prominently: "Geschatte prijs: €15.000 - €25.000"
   - Include disclaimer: "Dit is een indicatieve prijsschatting. De uiteindelijke prijs is afhankelijk van een plaatsbezoek."
   - Show confirmation that quote email has been sent
   - Optional appointment booking section (uses existing appointments API):
     - Calendar-style date picker with available dates highlighted
     - When date selected, show available time slots
     - Quick select for "Eerstvolgende beschikbaar" option
     - If booked, show confirmation with date/time
</ui_ux>
</requirements>

<constraints>
- Use existing appointments infrastructure (do not duplicate)
- Use existing email sending infrastructure (Resend)
- All user-facing text in Dutch
- Admin UI strings via `src/config/strings.ts`
- No new section type needed - use existing button action system
- Price ranges only (not exact quotes) - this is a lead generation tool
- Keep MVP simple - can extend later with more question types
- All database tables must include `site_id` for multi-site support
- Admin pages must use `usePermissions()` and `useSiteContext()` hooks
- Public APIs must support `?site=X` parameter for VPG cross-site fetching
- Admin UI must use existing shadcn/ui components (Button, Input, Select, Table, Card, etc.)
- Admin page structure must follow existing patterns (e.g., `src/app/admin/content/pages/`)
- Use existing admin layout components (PageHeader, DataTable patterns, form layouts)
- Only product questions are admin-manageable; contact fields and summary are fixed
</constraints>

<implementation_phases>
<!-- Each phase is independently testable and committable -->

<phase1 name="Database and Core Logic" status="COMPLETE">
**Commit:** `664f466` - `feat(configurator): add database schema and core logic`

1. ✅ Created database migrations for new tables (all with site_id)
2. ✅ Implemented `src/lib/configurator/` with site-scoped queries, pricing logic, types
3. ✅ Created default question configuration in `src/config/configurator.ts`
4. ✅ Added public API routes for questions and pricing (with site param support)

**Tested:**
- ✅ Migrations applied to Neon database
- ✅ `GET /api/configurator/questions?product=poolhouses` returns default questions
- ✅ `GET /api/configurator/pricing?product=poolhouses` returns pricing config
- ✅ `POST /api/configurator/calculate` returns price range for given answers
</phase1>

<phase2 name="Wizard Frontend (UI Only)" status="COMPLETE">
**Commit:** `9196912` - `feat(configurator): add wizard UI with steps 1-2`

1. ✅ Built `/configurator` page with 3-step wizard container
2. ✅ Implemented ProductStep: product selection + dynamic questions from API
3. ✅ Implemented ContactStep: fixed user details (follow contact form pattern)
4. ✅ Added progress bar and step navigation (back/next)
5. ✅ SummaryStep placeholder for phase 3

**Tested:**
- ✅ Visit `/configurator` - see step 1 with product dropdown
- ✅ Select product - questions load dynamically
- ✅ Fill questions, click next - see contact form (step 2)
- ✅ Fill contact, click next - see placeholder summary (step 3)
- ✅ Back button works between steps
- ✅ URL param `?product=poolhouses` pre-selects product
</phase2>

<phase3 name="Submission, Email and Appointments" status="COMPLETE">
**Commit:** `ad046b9` - `feat(configurator): add quote submission, email and appointment booking`

1. ✅ Implemented quote submission API (`POST /api/configurator/submit`)
2. ✅ Created `QuoteEmail.tsx` template (user version + admin notification)
3. ✅ Completed SummaryStep: price display, email confirmation, appointment booking
4. ✅ Integrated appointment availability (reuse existing APIs)
5. ✅ Stored submissions in database with site_id
6. ✅ Added analytics tracking for all steps

**Tested:**
- ✅ Complete wizard end-to-end
- ✅ Email sent with correct quote details (test mode routes to test email)
- ✅ Appointment booking works from summary step
- Book appointment from summary - verify it appears in admin appointments
- Check `quote_submissions` table has the submission
</phase3>

<phase4 name="Admin Interface" status="COMPLETE">
**Commit:** `37e623f` - `feat(configurator): add admin pages for questions and pricing`

1. ✅ Built admin page for managing product questions per product
   - Drag-drop reorder, add/edit/delete questions via sheet
2. ✅ Built admin page for managing pricing per product
3. ❌ Submissions view removed (admin gets email notification instead)
4. ✅ Added "Configurator" link to admin sidebar under "Content"
5. ✅ Added "configurator" as site-scoped feature in permissions system

**Tested:**
- ✅ Navigate to admin → Content → Configurator
- ✅ Add/edit/delete questions for a product
- ✅ Set pricing for a product
- ✅ Complete wizard - verify new questions/pricing are used
</phase4>
</implementation_phases>

<success_criteria>
- User can complete wizard from start to quote in under 3 minutes
- Price estimates are consistent and within defined ranges
- Appointment booking works seamlessly from wizard
- Admin can add/edit questions and pricing without code changes
- Quote submissions are stored and accessible in admin
- Emails are sent successfully on submission
- Analytics events track funnel conversion
</success_criteria>

<out_of_scope>
- User accounts / saved configurations
- Payment processing
- Exact pricing / binding quotes
- Complex conditional logic (show question X only if Y answered Z)
- Multi-language support (Dutch only)
- PDF quote generation (email only for MVP)
</out_of_scope>
