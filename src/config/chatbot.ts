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
  rateLimitMaxMessages: 2,

  /**
   * Rate limit time window in seconds (24 hours = 86400 seconds)
   * After this period, the message count resets
   * @default 86400 (24 hours)
   * @testing 180 (3 minutes for testing)
   */
  rateLimitWindowSeconds: 180, // 3 minutes for testing

  /**
   * How long to keep messages in browser localStorage and database (in days)
   * Messages older than this will be automatically deleted
   * @default 30
   * @testing 1 (1 day for testing)
   */
  messageRetentionDays: 1,

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

Wees professioneel, behulpzaam en bondig in het Nederlands.`,
} as const;

/**
 * Derived values (computed from config above)
 * These are automatically calculated - don't modify directly
 */
export const CHATBOT_COMPUTED = {
  /** Message retention in milliseconds */
  messageRetentionMs: CHATBOT_CONFIG.messageRetentionDays * 24 * 60 * 60 * 1000,
} as const;
