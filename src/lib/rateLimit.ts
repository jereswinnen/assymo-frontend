import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function checkRateLimit(
  sessionId: string,
  maxRequests: number = 10,
  windowSeconds: number = 86400, // 24 hours
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    // Get or create rate limit entry
    const result = await sql`
      SELECT
        COALESCE(count, 0) as current_count,
        COALESCE(window_start, NOW()) as start_time,
        CASE
          WHEN window_start IS NULL THEN true
          WHEN (window_start + INTERVAL '1 second' * ${windowSeconds}) <= NOW() THEN true
          ELSE false
        END as expired,
        COALESCE(
          EXTRACT(EPOCH FROM (window_start + INTERVAL '1 second' * ${windowSeconds}))::BIGINT,
          EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 second' * ${windowSeconds}))::BIGINT
        ) as reset_time
      FROM rate_limits
      WHERE key = ${sessionId}
      UNION ALL
      SELECT 0 as current_count, NOW() as start_time, true as expired,
        EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 second' * ${windowSeconds}))::BIGINT as reset_time
      WHERE NOT EXISTS (SELECT 1 FROM rate_limits WHERE key = ${sessionId})
      LIMIT 1
    `;

    const { current_count, expired, reset_time } = result[0];

    // Window expired, reset counter
    if (expired || current_count === 0) {
      await sql`
        INSERT INTO rate_limits (key, count, window_start)
        VALUES (${sessionId}, 1, NOW())
        ON CONFLICT (key)
        DO UPDATE SET count = 1, window_start = NOW()
      `;

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowSeconds * 1000,
      };
    }

    // Check if limit exceeded
    if (current_count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: reset_time * 1000,
      };
    }

    // Increment counter
    await sql`
      UPDATE rate_limits
      SET count = count + 1
      WHERE key = ${sessionId}
    `;

    return {
      allowed: true,
      remaining: maxRequests - current_count - 1,
      resetTime: reset_time * 1000,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowSeconds * 1000,
    };
  }
}
