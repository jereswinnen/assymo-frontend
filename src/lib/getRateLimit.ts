import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Get current rate limit status WITHOUT incrementing the counter
 * Used for checking if a window has expired
 */
export async function getRateLimit(
  sessionId: string,
  maxRequests: number = 10,
  windowSeconds: number = 86400,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  currentCount: number;
}> {
  try {
    // Get rate limit entry without modifying it
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

    const { current_count, expired, reset_time, current_time } = result[0];

    // If window expired, reset the counter in the database
    if (expired) {
      await sql`
        INSERT INTO rate_limits (key, count, window_start)
        VALUES (${sessionId}, 0, NOW())
        ON CONFLICT (key)
        DO UPDATE SET count = 0, window_start = NOW()
      `;

      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: (current_time + windowSeconds) * 1000,
        currentCount: 0,
      };
    }

    // Check if limit exceeded
    if (current_count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: reset_time * 1000,
        currentCount: current_count,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - current_count,
      resetTime: reset_time * 1000,
      currentCount: current_count,
    };
  } catch (error) {
    console.error("Rate limit get error:", error);
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowSeconds * 1000,
      currentCount: 0,
    };
  }
}
