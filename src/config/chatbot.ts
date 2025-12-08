/**
 * Chatbot Configuration
 *
 * Centralized configuration for the chatbot feature.
 * Modify these values to adjust chatbot behavior.
 */

export const CHATBOT_CONFIG = {
  /**
   * OpenAI model to use for chat responses
   * @example "gpt-5-nano-2025-08-07", "gpt-4o", "gpt-4o-mini"
   */
  model: "gpt-5-nano-2025-08-07",

  /**
   * Maximum number of messages a user can send within the rate limit window
   * @default 10
   */
  rateLimitMaxMessages: 10,

  /**
   * Rate limit time window in seconds (24 hours = 86400 seconds)
   * After this period, the message count resets
   * @default 86400 (24 hours)
   * @testing 180 (3 minutes for testing)
   */
  rateLimitWindowSeconds: 86400,

  /**
   * How long to keep messages in browser localStorage and database (in days)
   * Entire conversations are deleted when their first message exceeds this age
   * @default 30
   * @testing 1 (1 day for testing)
   */
  messageRetentionDays: 30,

  /**
   * Maximum character length for user input messages
   * Prevents abuse and keeps conversations focused
   * @default 200
   */
  maxInputLength: 200,

  /**
   * System prompt for the chatbot
   * Defines the chatbot's personality and instructions
   */
  systemPrompt: `Je bent een behulpzame klantenservice chatbot voor Assymo.
Beantwoord vragen over houten tuingebouwen, zoals tuinhuisjes, overkappingen, pergola's, carports en schuren.

Wees professioneel en KORT in het Nederlands. Geen lange zinnen of onnodige uitleg.

AFSPRAKEN:
- Als klant wil langskomen/boeken: ALTIJD EERST checkAvailability gebruiken en beschikbare tijden tonen.
- Vraag NOOIT om gegevens voordat de klant een datum+tijd heeft gekozen.
- Na checkAvailability: zeg alleen "Klik op een tijd of laat weten welk moment je past." NIET de tijden herhalen (die staan al in de UI).

BOEKINGSGEGEVENS:
De UI toont een formulier voor gegevens - je hoeft NIET uit te leggen wat nodig is.
- Na tijdkeuze: zeg alleen "Top!" of "Prima!" (het formulier verschijnt automatisch)
- Na ontvangst gegevens: DIRECT createAppointment aanroepen, GEEN bevestiging vragen
- Bij validatiefout: kort aangeven wat fout is
- Na succesvolle boeking: zeg alleen "Gelukt! Je ontvangt een bevestiging per e-mail."
- Bij fout (slot bezet): bied alternatieven aan met checkAvailability`,

  /**
   * Suggested questions to show to users
   * These appear when the conversation is empty to help users get started
   */
  suggestedQuestions: [
    "Welke houtsoorten gebruiken jullie?",
    "Wat zijn jullie openingstijden?",
    "Waar is jullie showroom gelegen?",
    "Vraag",
  ],
} as const;

/**
 * Derived values (computed from config above)
 * These are automatically calculated - don't modify directly
 */
export const CHATBOT_COMPUTED = {
  /** Message retention in milliseconds */
  messageRetentionMs: CHATBOT_CONFIG.messageRetentionDays * 24 * 60 * 60 * 1000,
} as const;
