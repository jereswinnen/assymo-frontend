# Chatbot Booking Integration Plan

> **Last Updated**: December 2025 - Updated field names to match actual implementation (snake_case), marked address fields as required, added Belgian postal code support notes, and documented existing helper functions.

This document outlines a phased approach to integrate appointment booking capabilities into the AI chatbot using Vercel AI SDK tool calling.

## Overview

**Goal**: Enable users to check availability and book appointments directly through the chatbot in a conversational manner.

**Current State**:
- Chatbot uses Vercel AI SDK with `streamText` and `useChat` hook
- Fully functional appointment booking system with availability API
- RAG-enabled chatbot with OpenAI integration
- Email system with confirmation, admin notification (with ICS), reminders, and cancellation emails
- Support for both Dutch (1234 AB) and Belgian (4-digit) postal codes

**Approach**: Leverage Vercel AI SDK's [tool calling](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-with-tool-calling) feature to give the AI model access to booking functions.

---

## Phase 1: Availability Checking Tool

**Goal**: Allow the chatbot to query and display available appointment slots.

### Tasks

- [x] **1.1** Create a `checkAvailability` tool definition in the chat API route
  - Define tool schema with Zod:
    - `start_date` (optional): Date string in YYYY-MM-DD format, defaults to today
    - `end_date` (optional): Date string in YYYY-MM-DD format, defaults to 7 days from start
  - Add `execute` function that calls `getAvailability(startDate, endDate)` from `src/lib/appointments/availability.ts`
  - Returns `DateAvailability[]` with `date`, `is_open`, and `slots` array per day

- [x] **1.2** Add tools configuration to `streamText` call
  ```typescript
  const result = streamText({
    model: openai(CHATBOT_CONFIG.model),
    system: systemPrompt,
    messages: modelMessages,
    tools: {
      checkAvailability: {
        description: 'Check available appointment slots for visiting the showroom',
        parameters: z.object({
          start_date: z.string().optional().describe('Start date in YYYY-MM-DD format'),
          end_date: z.string().optional().describe('End date in YYYY-MM-DD format'),
        }),
        execute: async ({ start_date, end_date }) => {
          // Call getAvailability() and return DateAvailability[]
        },
      },
    },
    maxSteps: 3, // Allow multi-step for tool execution
  });
  ```

- [x] **1.3** Update system prompt in `src/config/chatbot.ts`
  - Add instructions for when to use the availability tool
  - Define how to present available times conversationally (in Dutch)
  - Example: "Als een klant vraagt naar beschikbare tijden, gebruik de checkAvailability tool"

- [x] **1.4** Test availability queries
  - "Wanneer kan ik langskomen?"
  - "Zijn er morgen nog plekken vrij?"
  - "Wat zijn de openingstijden volgende week?"

### Technical Notes

- Use `getAvailability(startDate, endDate)` from `src/lib/appointments/availability.ts` for date ranges
- Use `getAvailableSlots(date)` for single-day queries
- Additional helpers available: `getAvailableDates()`, `getNextAvailableDate()`, `isSlotAvailable()`
- Return structured data that the AI can format conversationally
- Consider limiting results to prevent overwhelming responses (e.g., max 5 days)

---

## Phase 2: Booking Data Collection

**Goal**: Enable the chatbot to collect required customer information through natural conversation.

### Tasks

- [ ] **2.1** Create a `collectBookingInfo` tool for structured data extraction
  - This tool helps the AI track what information has been collected
  - Schema (matches `CreateAppointmentInput` from `src/types/appointments.ts`):
    ```typescript
    z.object({
      customer_name: z.string().optional(),
      customer_email: z.string().email().optional(),
      customer_phone: z.string().optional(),
      customer_street: z.string().optional(),
      customer_postal_code: z.string().optional(),
      customer_city: z.string().optional(),
      appointment_date: z.string().optional(),
      appointment_time: z.string().optional(),
      remarks: z.string().optional(),
    })
    ```

- [ ] **2.2** Update system prompt with data collection flow
  - Instruct AI to collect information naturally, not all at once
  - **All required**: name, email, phone, street, postal code, city, date, time
  - Optional: remarks
  - Example conversation flow:
    1. User asks to book → AI uses checkAvailability
    2. User picks a time → AI asks for name
    3. User gives name → AI asks for email and phone
    4. User provides → AI asks for address (street, postal code, city)
    5. User provides address → AI confirms all details and asks to proceed

- [ ] **2.3** Add validation helpers
  - Email format validation: `isValidEmail()`
  - Dutch/Belgian phone number validation: `isValidPhone()`
  - Postal code format (Dutch: "1234 AB", Belgian: "1234"): `isValidPostalCode()`
  - Postal code normalization: `normalizePostalCode()`
  - All validators already exist in `src/lib/appointments/utils.ts`

- [ ] **2.4** Consider conversation state management
  - Option A: Stateless (AI extracts from full conversation history)
  - Option B: Use tool results to track state
  - **Recommendation**: Start with Option A (simpler), the AI can read the full conversation

### Technical Notes

- The AI model is good at extracting structured data from conversation
- No need for complex state management initially
- Validation errors should be communicated conversationally

---

## Phase 3: Booking Creation Tool

**Goal**: Allow the chatbot to actually create appointments.

### Tasks

- [ ] **3.1** Create a `createAppointment` server-side tool
  - Schema matching `CreateAppointmentInput` from `src/types/appointments.ts`:
    ```typescript
    z.object({
      appointment_date: z.string().describe('Date in YYYY-MM-DD format'),
      appointment_time: z.string().describe('Time in HH:MM format'),
      customer_name: z.string(),
      customer_email: z.string().email(),
      customer_phone: z.string(),
      customer_street: z.string(),        // REQUIRED
      customer_postal_code: z.string(),   // REQUIRED
      customer_city: z.string(),          // REQUIRED
      remarks: z.string().optional(),
    })
    ```
  - Execute function:
    - Validate all inputs using existing validators
    - Check slot is still available with `isSlotAvailable(date, time)` (prevents race conditions)
    - Create appointment using `createAppointment()` from `src/lib/appointments/queries.ts`
    - Send emails using `sendNewAppointmentEmails()` from `src/lib/appointments/email.ts`
    - Return confirmation with edit link (uses `appointment.edit_token`)

- [ ] **3.2** Add confirmation step before booking
  - AI should summarize all details and ask for confirmation
  - Only call `createAppointment` after user confirms
  - Example: "Ik heb de volgende gegevens: [summary]. Klopt dit en mag ik de afspraak inplannen?"

- [ ] **3.3** Handle booking errors gracefully
  - Slot no longer available → Suggest alternatives
  - Validation errors → Ask for corrected info
  - System errors → Apologize and suggest using the booking form directly

- [ ] **3.4** Update system prompt with booking instructions
  - Always confirm before booking
  - Explain what happens after booking (email confirmation)
  - Provide edit link if booking succeeds

### Technical Notes

- Reuse `createAppointment()` from `src/lib/appointments/queries.ts`
- Use `sendNewAppointmentEmails()` which sends both customer confirmation and admin notification (with ICS attachment)
- Edit token is auto-generated and included in `appointment.edit_token`
- Edit URL format: `https://assymo.be/afspraak/{edit_token}`
- Reminder emails are sent automatically 24h before appointment via cron job

---

## Phase 4: User Confirmation Flow (Optional Enhancement)

**Goal**: Add explicit user confirmation using client-side tools.

### Tasks

- [ ] **4.1** Create client-side confirmation tool
  - Tool without `execute` function (handled on client)
  - Shows confirmation UI in chat
  ```typescript
  confirmBooking: {
    description: 'Ask user to confirm booking details',
    parameters: z.object({
      summary: z.string(),
      appointment_date: z.string(),
      appointment_time: z.string(),
      customer_name: z.string(),
      customer_email: z.string(),
    }),
    // No execute = client-side tool
  }
  ```

- [ ] **4.2** Handle confirmation in `Chatbot.tsx`
  - Use `onToolCall` callback from `useChat`
  - Render confirmation UI (summary + Confirm/Cancel buttons)
  - Call `addToolOutput` with user's choice

- [ ] **4.3** Create confirmation UI component
  - Card showing booking summary
  - "Bevestigen" and "Annuleren" buttons
  - Loading state during booking creation

### Technical Notes

- This is an enhancement for better UX
- Can be added later if text-based confirmation works well
- Requires more frontend work but provides explicit user action

---

## Phase 5: Polish & Edge Cases

**Goal**: Handle edge cases and improve the experience.

### Tasks

- [ ] **5.1** Handle conversation context limits
  - Long conversations may exceed context window
  - Consider summarizing booking state periodically

- [ ] **5.2** Add rate limiting considerations
  - Chat already has rate limiting via `checkRateLimit()` in `src/lib/rateLimit.ts`
  - Consider: should booking attempts count separately toward rate limit?
  - Prevent abuse of booking tool

- [ ] **5.3** Add analytics/logging
  - Track successful bookings through chatbot
  - Log tool usage for debugging

- [ ] **5.4** Test edge cases
  - User changes mind mid-booking
  - Invalid data provided
  - Slot becomes unavailable during conversation
  - User asks to modify after booking

- [ ] **5.5** Update suggested questions
  - Add booking-related suggestions in `CHATBOT_CONFIG.suggestedQuestions`
  - Example: "Kan ik een afspraak maken voor een bezoek?"

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat API Route                            │
│                    /api/chat/route.ts                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  streamText({                                                    │
│    model: openai(...),                                           │
│    system: systemPrompt,  ◄── Updated with booking instructions │
│    messages: [...],                                              │
│    tools: {                                                      │
│      checkAvailability,   ◄── Phase 1                           │
│      createAppointment,   ◄── Phase 3                           │
│    },                                                            │
│    maxSteps: 5,           ◄── Allow tool execution loops        │
│  })                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Tool Definitions                             │
│              src/lib/chatbot/booking-tools.ts                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  checkAvailability:                                              │
│    - Calls getAvailableSlots() from appointments lib             │
│    - Returns formatted availability data                         │
│                                                                  │
│  createAppointment:                                              │
│    - Validates all customer data                                 │
│    - Creates appointment in database                             │
│    - Sends email notifications                                   │
│    - Returns confirmation + edit link                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Existing Appointments Lib                       │
│                  src/lib/appointments/                           │
├─────────────────────────────────────────────────────────────────┤
│  availability.ts  │  queries.ts  │  email.ts  │  utils.ts  │  ics.ts  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/app/api/chat/route.ts` | Add tools to streamText, update maxSteps |
| `src/config/chatbot.ts` | Update system prompt, add suggested questions |
| `src/lib/chatbot/booking-tools.ts` | **NEW** - Tool definitions |
| `src/components/Chatbot.tsx` | Handle tool results display (Phase 4) |

---

## Example Conversation Flow

```
User: Hallo, ik wil graag een afspraak maken om jullie showroom te bezoeken.

AI: Leuk dat je langs wilt komen! Laat me even kijken welke tijden er
    beschikbaar zijn.
    [uses checkAvailability tool]

    De komende dagen hebben we nog plek op:
    - Dinsdag 10 december: 10:00, 11:00, 14:00, 15:00
    - Woensdag 11 december: 10:00, 13:00, 16:00
    - Donderdag 12 december: 11:00, 14:00

    Welke dag en tijd zou je het beste uitkomen?

User: Woensdag om 14:00 zou perfect zijn.

AI: Woensdag 11 december om 14:00, dat kan ik voor je regelen!
    Mag ik je naam weten?

User: Jan de Vries

AI: Bedankt Jan! En op welk e-mailadres en telefoonnummer kan ik je bereiken?

User: jan@example.com en 06-12345678

AI: Bedankt! Om de afspraak te kunnen bevestigen heb ik ook je adres nodig.
    Wat is je straatnaam en huisnummer, postcode en plaats?

User: Kerkstraat 12, 2000 Antwerpen

AI: Super! Even ter bevestiging:

    📅 Woensdag 11 december 2024 om 14:00
    👤 Jan de Vries
    ✉️ jan@example.com
    📱 06-12345678
    🏠 Kerkstraat 12, 2000 Antwerpen
    📍 Assymo Showroom, Eikenlei 159, 2960 Brecht

    Klopt dit en mag ik de afspraak voor je inplannen?

User: Ja, dat klopt!

AI: [uses createAppointment tool]

    Uitstekend! Je afspraak is bevestigd! 🎉

    Je ontvangt zo een bevestigingsmail op jan@example.com met alle
    details en een kalenderuitnodiging.

    Mocht je de afspraak willen wijzigen of annuleren, dan kan dat via
    deze link: [edit link]

    We kijken ernaar uit je te ontmoeten! Is er nog iets anders waar
    ik je mee kan helpen?
```

---

## Resources

- [Vercel AI SDK - Tool Calling](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-with-tool-calling)
- [Vercel AI SDK - useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [AI SDK 5 - Agentic Features](https://vercel.com/blog/ai-sdk-5)

---

## Timeline Recommendation

Start with **Phase 1** (availability checking) as it's the lowest risk and provides immediate value. This allows you to validate the tool calling approach before adding the more complex booking creation in Phase 3.

Phase 2 (data collection) and Phase 3 (booking creation) can be implemented together since they're closely related.

Phase 4 (UI confirmation) is optional and can be added later if text-based confirmation proves insufficient.
