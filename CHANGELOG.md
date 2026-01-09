# Changelog

A complete history of development on the Assymo Frontend project, organized by day.

---

## 2026

### January 5, 2026
- **fix:** Handle site_parameters table with broken id column

### January 4, 2026
- **chore:** Cleanup

---

## 2025

### December 30, 2025
**Major Focus: Permission System Polish & UI Refinements**

- **docs:** Add usage logs system exploration document
- **docs:** Add strings config and permissions to CLAUDE.md
- **style:** Clean up strings config and fix consistency
- **refactor:** Centralize admin UI strings with `t()` helper
- **refactor:** Widen media library dialog and show more columns
- **fix:** Auto-close mobile sidebar on route change
- **feat:** Add VPG logo variant to Logo component
- **refactor:** Reorganize components folder structure
- **refactor:** Use AlertDialog for delete confirmation in DateOverrides
- **refactor:** Convert AppointmentDialog to AppointmentEditSheet
- **refactor:** Rename sheet components for consistency
- **refactor:** Move admin sheets to dedicated /sheets folders
- **refactor:** Replace user dialogs with sheets
- **feat:** Use skeleton loading state for site selector
- **feat:** Add skeleton loading state to admin sidebar
- **fix:** Prevent flash of all menu items while loading permissions
- **fix:** Robust permission system with fresh DB queries
- **fix:** Resolve hydration mismatch and feature override parsing
- **fix:** Import from specific permission files in client components
- **refactor:** Extract getEffectiveFeatures and parseFeatureOverrides utilities
- **chore:** Remove old documentation and completed prompts
- **style:** Update site selector icon and select component styling
- **chore:** Remove dead code and fix duplication
- **feat:** Add permission-based navigation and smart redirect
- **refactor:** Migrate all admin API routes to protectRoute
- **feat:** Implement role-based navigation and API permissions
- **fix:** Auto-detect base URL for Better Auth on Vercel
- **fix:** Add baseURL to Better Auth config for correct reset URLs
- **fix:** Pass request headers to Better Auth for correct reset URL
- **fix:** Use Better Auth API for password reset when creating users
- **fix:** Manually create password reset token and send email
- **fix:** Actually delete users instead of just demoting them
- **style:** Add hover delete button to users table rows
- **fix:** Correct password reset endpoint and add user delete button

### December 29, 2025
**Major Focus: Multi-Site System & User Management**

- **feat:** Add user creation via admin interface
- **feat:** Add profile section with name and avatar editing
- **refactor:** Improve sites page UX with row click and AlertDialog
- **style:** Unify empty states and remove unnecessary UI elements
- **refactor:** Update account page and sidebar user menu
- **feat:** Add personal account settings page (Phase 8)
- **docs:** Add Content API reference for external sites
- **docs:** Mark Phase 7 as complete
- **feat:** Add multi-site public content API
- **feat:** Add Phase 7 refinements and edge case protections
- **fix:** Connect frontend content pages to site context
- **feat:** Add multi-site filtering to all content API routes
- **feat:** Implement Phase 4 & 5 - user management and site scoping
- **feat:** Implement Phase 3 - route protection
- **feat:** Implement Phase 2 - permission utilities
- **feat:** Implement Phase 1 - database schema foundation
- **docs:** Add phase checklist, remove Drizzle prompt
- **docs:** Add media_folders, keep site_parameters name
- **docs:** Add /admin/account page to design (Phase 8)
- **docs:** Add multi-user roles/permissions design document
- Add font display swap for better loading performance
- Revert to revalidateTag for cache invalidation
- Switch to updateTag for instant cache invalidation
- Add content caching with on-demand revalidation

### December 27, 2025
**Major Focus: Media Library Folders**

- Fix useSearchParams Suspense boundary errors
- Merge pull request #4 - Add media folders
- Add folder rename and delete actions to media library
- Use URL params for media folder navigation with breadcrumbs
- Fix media folder filtering and drag-drop styling
- Use Empty component for media library empty state

### December 25, 2025
- Add folder support to media library

### December 24, 2025
**Major Focus: Upload System Improvements**

- Merge pull request #3 - Check upload limit
- Replace old server upload route with client-side upload
- Increase upload limit to 25MB with client-side Vercel Blob upload

### December 23, 2025
**Major Focus: Admin UX Refinements**

- Move prompts to .prompts directory
- Update CLAUDE.md to reflect custom CMS architecture
- Make admin sidebar logo link to appointments
- Render address as HTML in header
- Fix FlexTextBlock button not rendering
- Add chatbot action option to button/action forms
- Fix FlexTextBlock text field mismatch
- Render address as HTML in footer
- Change address field to RichTextEditor in site parameters
- Apply FieldSet/FieldGroup pattern to AppointmentDialog edit mode
- Refactor CreateAppointmentForm to use Sheet and FieldSet
- Refactor DateOverrides form to use Sheet component
- Add tooltips and improve table styling
- Move appointments tab actions to header
- Improve email template preview layout
- Consolidate EmailDashboard into emails page
- Move email page actions to header
- Refactor email detail page with Field components and header actions
- Add breadcrumb navigation to admin header
- Consolidate settings page and add icons to Field sections
- Replace Cards with Field components in parameters page
- Refactor filters page with Table layout and Sheet editing
- Simplify page/solution creation and add URL previews to editors
- Refactor navigation page and add URL previews across admin forms

### December 22, 2025
**Major Focus: Section Editor & Media Gallery Redesign**

- Add drag-and-drop image upload to media gallery
- Redesign media gallery with full-bleed thumbnails and sidebar layout
- Use RichTextEditor for FlexFormBlock subtitle
- Update lucide-react to 0.562.0
- Add icons to FlexibleSectionForm block types
- Restructure Flex block forms using Field, FieldGroup components
- Remove moveBlock up/down functions from FlexibleSectionForm
- Fix Slideshow image data structure mismatch
- Filter out images without valid URLs in Slideshow component
- Add drag-and-drop reordering to SlideshowForm images
- Refine UspSectionForm and SolutionsScrollerForm styling
- Add Actie toggle to UspSectionForm for link fields
- **feat:** Limit USP items to 5 and disable add button at max
- **refactor:** Restructure SplitSectionForm to match PageHeaderForm style
- **fix:** Translate button variant labels to Dutch
- **fix:** Disable sheet Save button when no changes
- **feat:** Add Save button to section editor sheet
- **feat:** Add icon preview to IconSelect dropdown
- **chore:** Reorganize prompts to .prompts folder and add auto-save prompt
- **style:** Simplify SectionList row actions and update Sheet title
- **style:** Remove column headers from SectionList table
- **refactor:** Convert SectionList from accordion to table UI
- Fix alt text polling to stop on unmount and limit retries
- Remove debug logging and unused variables
- Add Toaster component to admin layout for toast notifications
- Close dialog before showing toast to ensure visibility
- Use decoded imageUrl for detail page delete
- Use same delete endpoint for detail page as thumbnail
- Fix URL encoding: use encoded URL for DB, decoded for Vercel Blob
- Fix URL encoding consistency in media API routes
- Fix error handling and add debug logging for image deletion
- Fix dialog handling for image deletion errors
- Show API error message when image deletion is blocked
- Block image deletion when still referenced in content

### December 19, 2025
**Major Focus: Complete Sanity to Postgres Migration**

- Refine ImageUpload with buttons and Item component
- Update Next.js to 16.1.0 and eslint-config-next to 16.1.0
- Refine section list styling and spacing
- Use Empty component for SectionList empty state
- Restructure solutions detail page to match pages layout
- Refactor section forms to use Field components
- Refactor page detail sidebar to use Field components
- Move 'Sectie toevoegen' button next to section title
- Restructure page detail layout
- Refactor solutions list to use Table component
- Format globals.css and alert-dialog component
- Use small buttons throughout admin interface
- Add header actions system for admin pages
- Extract formatting utilities with tests
- Add alt text generation progress indicator and regenerate button
- Improve media library display and simplify ImageUpload
- Auto-generate Dutch alt text for uploaded images
- Add duplicate feature for pages and solutions
- Add media library picker to ImageUpload component
- Add image metadata management with media library as single source of truth
- Unify admin content pages with layout header pattern
- Show header navigation in footer
- **Remove Sanity CMS - Phase 19 complete**
- Add RichText editors and consolidate icon options
- Switch frontend from Sanity to Postgres CMS
- Remove test routes
- Fix PageHeader to support both HTML and Portable Text subtitles
- Add test routes for CMS content
- Add FlexibleSection form (Phase 16)
- Fix Tiptap SSR hydration error
- Add Tiptap rich text editor (Phase 15)
- Add complex section forms (Phase 14)
- Add simple section forms (Phase 13)
- Add section builder core (Phase 12)

### December 18, 2025
**Major Focus: Custom CMS Foundation**

- Add solutions list and editor (Phase 11)
- Fix media browser to show uploaded images immediately
- Add media browser (Phase 10)
- Fix image upload preview and add Vercel Blob domain
- Add page editor with basic fields (Phase 9)
- Add pages list view (Phase 8)
- Simplify navigation editor to header-only
- Phase 7: Add navigation editor
- Update filter queries to use order_rank for sorting
- Add dnd-kit for drag-to-reorder in filters page
- Phase 6: Add filter categories editor
- Phase 5: Add site parameters editor
- Adjusted some icons in the admin sidebar
- Phase 4: Add Content section to admin sidebar
- Phase 3: Add content data layer and reorder phases
- Phase 2: Add Vercel Blob image storage
- Phase 1: Add CMS database schema
- Add progress checkboxes to CMS build plan
- Minor layout tweak on auth page
- Break plan into 18 smaller phases, leverage shadcn
- Rewrite plan for full Sanity replacement
- Revise content studio analysis with realistic assessment
- Add analysis document for custom Sanity admin studio

### December 17, 2025
**Major Focus: Auth UI Polish**

- Auth routes UX/UI mobile tweaks
- Updated admin settings page
- Updated auth background
- Tweaked auth routes UX/UI (part 2)
- Tweaked auth routes UX/UI
- Reorganize components folder structure

### December 12, 2025
**Major Focus: Authentication System with MFA**

- Fixed some typos
- Add optional MFA choice page for new users
- Add copy setup code button to 2FA setup
- Add security settings page (Phase 16)
- Add passkey authentication (Phase 15)
- Add two-factor authentication (Phase 14)
- Simplify auth routes: /admin/auth is now login page
- Refactor auth pages to /admin/auth/ route group
- Add password reset functionality (Phase 13)
- Simplify auth-client to auto-detect origin
- Rename middleware.ts to proxy.ts for Next.js 16
- Remove old auth routes replaced by Better Auth
- Add middleware for admin route protection
- Add auth utilities and update admin API routes
- Update AdminSidebar logout to use Better Auth
- Update admin login page for Better Auth
- Add admin user creation script
- Add Better Auth API route handler
- Replace auth.ts with Better Auth configuration
- Add Better Auth dependencies for admin authentication
- Added shadcn otp component
- Fix test environment for Vercel builds
- Document testing setup in CLAUDE.md
- Add ICS calendar generation tests
- Configure tree reporter for Vitest
- Run tests before build for Vercel CI
- Add appointment utility tests
- Add Vitest testing setup

### December 10, 2025
**Major Focus: Appointment System Enhancements**

- Restore entrance animations on project cards
- Fix type error in realisaties skeleton
- Fix CLS on realisaties page with skeleton fallback
- Convert ClosureBanner to server component to eliminate CLS
- Added Vercel Speed Insights
- Add email to header contact info
- Move save button to header in settings page, add icons to tabs
- Add open chatbot action to flexible section button
- Made it more clear that the user can click a suggested question in chatbot
- Admin layout tweaks
- **refactor:** Rename appointment_settings table to appointment_opening_hours
- **feat:** Block same-day bookings + improve phone validation
- **refactor:** Use FieldGroup in DateOverrides dialog + fix hydration error
- **refactor:** Rename AppointmentSettings to OpeningHours
- **feat:** Add email to footer contact info
- **chore:** Add radix-ui switch component
- **feat:** Enhanced date overrides with recurring, date ranges, and website banner
- Scroll time slots into view when selecting a date
- Close filter popover after selection
- Update filter queries to use orderRank
- Sort solutions by orderRank instead of name

### December 9, 2025
**Major Focus: Admin Panel Redesign**

- Refactor admin components to use lifted state pattern
- Improve email editing and conversation dialog UX
- Refine admin UI with tables, tabs, and hydration fix
- Replace horizontal nav with shadcn sidebar
- Added shadcn sidebar component
- Refactor admin panel from tabs to route-based navigation
- Reorder admin tabs and default to Afspraken
- Hide slogan on home page
- Added placeholder disclaimer message in chatbot
- Add favicon and app icons
- Add image preloading and loading spinner to Slideshow
- Fix params handling for Next.js 15 in realisaties page
- Adjusted site max-width on larger screens
- Simplify booking form to 2 steps, submit directly from details step
- Use relative URL for appointment redirect to support localhost and preview builds
- Rename DateTimePicker to Calendar and AppointmentBookingForm to BookingForm
- Remove unused SalonizedBooking component
- Removed testing flags from email titles
- Updated logo in email templates
- Updated system prompt and question suggestions

### December 8, 2025
**Major Focus: Chatbot Booking Integration**

- Add booking UI components (Phase 4)
- Add appointment creation tool (Phase 3)
- Add booking data collection tool (Phase 2)
- Add chatbot availability checking tool (Phase 1)
- Update chatbot booking integration plan to match current implementation
- Consolidate appointment pages into single [token] route
- Appointment success page redesign
- Merge pull request #2 - Chatbot booking plan
- Updated cron jobs to allow sending appointment reminders
- Merge pull request #1 - Add appointment reminders

### December 7, 2025
- Add chatbot booking integration plan

### December 6, 2025
- Update package-lock.json
- Add appointment reminder emails
- tsconfig tweak
- Update Next.js to 16.0.7
- Move unsubscribeContact to lib to fix Next.js route export error
- Fix Next.js route export error in email-preview

### December 5, 2025
**Major Focus: Appointment Booking Flow & Email System**

- Resolved some build errors
- Combine date and time selection into single step
- Header route tweak
- Afspraak page design and layout changes
- Clean up AppointmentBookingForm formatting
- Fix React setState-during-render warning in DatePicker
- Add newsletter unsubscribe functionality
- Add clickable contact links to email templates
- Improve email templates with clickable links
- Use inline SVG logo and match Action button styling in emails
- Add refresh button to email template preview
- Unify email templates with shared components and add admin preview
- Fix appointment dialog not updating after edit
- Removed some unused imports
- Improve appointment form UX and support Belgian postal codes
- Improve admin appointments UI polish
- Fix appointment view API response format
- Wrap SettingsPanel in Card component for consistent layout
- Add admin Settings tab with test email configuration
- Add appointment booking system - Phase 6: Public frontend components

### December 4, 2025
**Major Focus: Appointment Booking System Core**

- Change week to start on Monday instead of Sunday
- Add appointment booking system - Phase 5: Admin UI components
- Add appointment booking system - Phase 4: Admin API routes
- Add appointment booking system - Phase 3: Public API routes
- Add appointment booking system - Phase 2: Email system
- Add appointment booking system - Phase 1: Database & core infrastructure
- Resolved some build errors
- Updated cookie consent copy
- Added slogan to header
- Updated cookie consent banner content
- Adjusted cookie banner content, functionality and appearance
- Initial implementation of cookie consent functionality

### December 3, 2025
- Made sure 'Slideshow' pauses on hover and renamed 'ChatbotWidget' to 'ChatbotWrapper'
- Add FlexibleSection frontend components
- Remove unused section types and convert Map, ContactForm, SalonizedBooking to standalone components
- 'FilterBar' optimisations and re-added crossfade transition to 'Slideshow' component

### December 2, 2025
- Updated slideshow behaviour on mobile
- Updated 'SlideShow' component interaction and design
- Updated 'pageHeader' structure

### December 1, 2025
**Major Focus: Mobile Menu Implementation**

- Updated 'pageHeader' component to show header image
- Resolved a bug where the menu would not close when changing routes
- Added 'background' prop on 'PageHeader' component
- Mobile menu UX/UI improvements
- Initial implementation of mobile menu
- Footer element order tweak on mobile

### November 28, 2025
**Major Focus: Project Filtering System**

- Resolved a Vercel build error regarding HeaderClient (multiple attempts)
- Turned on header debugging
- Footer tweaks
- Minor color tweaks
- Made entire project card clickable
- Added a subtle transition when changing filters
- Highlighted current page in navigation
- Minor tweaks to filtering
- Added the ability to filter projects
- Refactor realisaties page with sections support and consolidate grid components
- Initial implementation of filters
- Renamed various routes
- Made contact form submit button consistent with newsletter
- Rename ProductGrid to ProjectGrid and fix SplitSection layout
- Add custom test email dialog
- Add broadcast sending and subscriber stats (Phase 6)

### November 27, 2025
**Major Focus: Newsletter System (Resend Integration)**

- Updated Resend todo doc
- Add testEmail config for newsletter test recipients
- Add newsletter composer to admin panel (Phase 5)
- Updated Resend todo doc
- Add newsletter types config and update broadcast email template
- Updated Resend implementation doc
- Added newsletter opt in to all subjects in contact form
- Refactored contact form and integrated with Resend
- Updated Resend todo document
- Updated newsletter form with Resend functionality and added email template for newsletter
- Configured Resend
- Added resend dependency
- Minor visual tweaks to footer
- Added newsletter input to footer

### November 26, 2025
- Reworked footer
- Minor visual tweaks to CTA in 'uspSection'
- Integrated Sanity Studio in 'SolutionsScroller' component
- Reworked structure and design of 'SolutionsScroller' component

### November 25, 2025
- Initial implementation of 'SolutionsScroller' component
- Updated grid--bleed modifier and updated 'uspSection' design
- Initial implementation of 'uspSection' and made icons more generally available

### November 24, 2025
- Added necessary types for 'splitSection' component
- Various tweaks and enhancements to 'SplitSection'
- Header nav positioning tweak and added initial implementation of 'SplitSection' component
- Updated main slideshow functionality and transition

### November 21, 2025
**Major Focus: Header Redesign**

- Fine-tuned header interactions
- Updated header to fetch data from Sanity Studio
- Added header interactions
- Updated header structure and added Motion package
- Fixed some layout inconsistencies
- Styled navigation component and turned off reasoning in chat route

### November 20, 2025
- Added extra icons to 'pageHeader' block
- Added 'pageHeader' block type
- Reworked header (part 1)
- Added various building blocks

### November 19, 2025
**Major Focus: Chatbot UX Refinements**

- Added dummy CTAs
- Minor UI tweaks
- More chat UX/UI tweaks
- Chatbot UX/UI tweaks
- Improved chatbot opening and closing animation
- Updated message retention logic to be more reliable
- Added admin page title

### November 18, 2025
**Major Focus: Admin Authentication & RAG System**

- Admin auth UI tweaks
- Admin UI improvements
- Resolved a bug with calling inline JSON.stringify causing the SQL template literals to not work properly
- Redirected users to /login when going to /admin
- Removed deprecated bearer tokens in favor of a proper auth secret
- Added authentication layer to admin
- Updated CLAUDE.md
- Resolved some build errors
- Added admin page title
- Added some debug logging to document parser
- Minor admin UI tweaks
- Added document parsing and integrated with OpenAI embedding model. Also updated chat to use context from embeddings
- Added alert, badge and progress shadcn components
- Typo

### November 17, 2025
**Major Focus: Admin Panel & Message Persistence**

- Further admin layout tweaks
- Added more shadcn components
- Added dialog and sonner shadcn components
- Separated admin route from public routes
- Minor tweaks to chatbot input area
- Admin tweaks
- Added various API routes and logic to save messages to database and added retentionDays logic
- Removed unused import
- Made chatbot available throughout the website and minor design tweaks
- Code cleanup
- Removed some debug logs regarding rate limit
- Resolved some bugs where the limit wouldn't correctly be set or reset

### November 14, 2025
**Major Focus: Initial Chatbot Implementation**

- Added some logging when saving the chat conversation
- Added input limit and disabled input when model is responding
- Enabled frontend communication with OpenAI GPT5 nano and defined local variables for key logic
- Minor styling tweaks
- Installed AI SDK and init Neon DB through Vercel
- Added explanation doc/guide
- Added 'ChatbotWidget' component and implemented dummy messaging functionality

### November 13, 2025
- Initial frontend chatbot implementation
- Shadcn components init

### October 17, 2025
- Header optimisations on mobile

### October 1, 2025
- Added contact form to frontend

### September 30, 2025
- Added calendar section to frontend

### September 20, 2025
- Tweaked grid sorting

### September 18, 2025
- Fixed two type errors
- Made two more sections available in the frontend
- Header and footer tweaks
- Made header sticky on scroll
- Font scale tweaks
- Fixed grid order of 'SlideshowLeftTextRight' section

### August 29, 2025
- Further design and layout tweaks to header and footer
- Header and footer tweaks

### August 22, 2025
- Layout tweaks
- Changes
- Add ProductGrid section component for displaying solution grids

### August 21, 2025
**Major Focus: Slideshow Component**

- Fix slideshow navigation button functionality
- Added logo in header
- Fix NavLinks spacing
- Hide logo in footer
- Fix React hooks order violation in Slideshow component
- Optimize slideshow component with auto-play and responsive sizing
- Add slideshow section types with navigation and image support

### August 19, 2025
- Add TextCentered section and update solution pages
- Modular sections tweaks and removed static 'contact' page content

### August 17, 2025
- Add modular sections system for Sanity CMS
- Added Claude init

### July 10, 2025
**Major Focus: Mobile Responsiveness**

- Contact page layout mobile tweaks
- Hero mobile tweaks
- Header mobile tweaks
- UPSSection mobile tweaks

### July 4, 2025
- Updated footer info
- Updated contact page and added Google Maps embed
- Tweaked 'SolutionCard' layout and hover effect
- Tweaked 'Oplossingen' layout
- Added USP section and updated homepage to include the section

### June 27, 2025
**Major Focus: Homepage Design**

- Initial stab at footer
- Added 'solutions' on homepage
- Further hero styling and page structure refactor
- Hero styling and highlighting current page in header

### June 21, 2025
- Package update
- Tweaked 'Header' and 'Footer' styling
- Implemented a submenu inside the 'Header' component

### June 20, 2025
- Sanity studio naming changes
- Added 'about' and 'contact' placeholder pages

### June 19, 2025
- Added Favicon

### June 18, 2025
- Added Google Font 'Figtree'
- Sanity init
- Minor Tailwind v4 tweaks
- Configure tailwind v4

### June 17, 2025
- Added solution detail pages

### June 16, 2025
- Update project: Added solution query and placeholder detail page
- Added solutions list page

### June 14, 2025
- Initialize project
- Initial commit from Create Next App

---

## Summary

This project evolved from a simple Next.js frontend into a comprehensive business application with:

1. **Custom CMS** - Complete replacement of Sanity CMS with a Postgres-backed admin panel (December 2025)
2. **AI Chatbot** - RAG-enabled chatbot with appointment booking capabilities (November-December 2025)
3. **Appointment System** - Full booking system with email confirmations and reminders (December 2025)
4. **Authentication** - Better Auth with TOTP and WebAuthn passkey support (December 2025)
5. **Newsletter System** - Resend integration for email marketing (November 2025)
6. **Multi-Site Support** - Role-based permissions and site scoping (December 2025)
7. **Media Library** - Vercel Blob storage with folder organization and auto-generated alt text (December 2025)

Total commits: 476
Development period: June 2025 - January 2026
