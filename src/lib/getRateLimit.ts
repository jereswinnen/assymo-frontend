import { getRateLimitStatus, resetRateLimitCounter } from "./rateLimitQueries";

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
    const { current_count, expired, reset_time, current_time } =
      await getRateLimitStatus(sessionId, windowSeconds);

    // If window expired, reset the counter in the database
    if (expired) {
      await resetRateLimitCounter(sessionId, 0);
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
