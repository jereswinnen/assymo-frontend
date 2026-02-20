import { sql } from "@/lib/db";

/**
 * Shared query to get rate limit status from database
 * Returns current count, expiry status, and reset time
 */
export async function getRateLimitStatus(
  sessionId: string,
  windowSeconds: number,
) {
  const result = await sql`
    SELECT
      COALESCE(count, 0) as current_count,
      CASE
        WHEN window_start IS NULL THEN true
        WHEN (window_start + INTERVAL '1 second' * ${windowSeconds}) <= NOW() THEN true
        ELSE false
      END as expired,
      COALESCE(
        EXTRACT(EPOCH FROM (window_start + INTERVAL '1 second' * ${windowSeconds}))::BIGINT,
        EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 second' * ${windowSeconds}))::BIGINT
      ) as reset_time,
      EXTRACT(EPOCH FROM NOW())::BIGINT as current_time
    FROM rate_limits
    WHERE key = ${sessionId}
    UNION ALL
    SELECT 0 as current_count, true as expired,
      EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 second' * ${windowSeconds}))::BIGINT as reset_time,
      EXTRACT(EPOCH FROM NOW())::BIGINT as current_time
    WHERE NOT EXISTS (SELECT 1 FROM rate_limits WHERE key = ${sessionId})
    LIMIT 1
  `;

  return result[0];
}

/**
 * Reset rate limit counter for a session
 * Sets count to the specified value and resets the window
 */
export async function resetRateLimitCounter(
  sessionId: string,
  count: number,
): Promise<void> {
  await sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${sessionId}, ${count}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET count = ${count}, window_start = NOW()
  `;
}

/**
 * Increment rate limit counter for a session
 */
export async function incrementRateLimitCounter(
  sessionId: string,
): Promise<void> {
  await sql`
    UPDATE rate_limits
    SET count = count + 1
    WHERE key = ${sessionId}
  `;
}

/**
 * Cleanup old rate limit entries (older than 7 days)
 */
export async function cleanupOldRateLimits(): Promise<void> {
  await sql`
    DELETE FROM rate_limits
    WHERE window_start < NOW() - INTERVAL '7 days'
  `;
}

/**
 * Cleanup old chat conversations based on retention days
 * Used by cron job to ensure GDPR compliance
 *
 * Deletes entire conversations (all messages in a session) where the
 * first message is older than the retention period.
 */
export async function cleanupOldConversations(
  retentionDays: number,
): Promise<void> {
  await sql`
    DELETE FROM chat_conversations
    WHERE session_id IN (
      SELECT session_id
      FROM chat_conversations
      GROUP BY session_id
      HAVING MIN(created_at) < NOW() - INTERVAL '1 day' * ${retentionDays}
    )
  `;
}
