import {
  getRateLimitStatus,
  resetRateLimitCounter,
  incrementRateLimitCounter,
  cleanupOldRateLimits,
} from "./rateLimitQueries";

export async function checkRateLimit(
  sessionId: string,
  maxRequests: number = 10,
  windowSeconds: number = 86400, // 24 hours
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    // Cleanup: Remove old rate limit entries (older than 7 days)
    await cleanupOldRateLimits();

    // Get current rate limit status
    const { current_count, expired, reset_time, current_time } =
      await getRateLimitStatus(sessionId, windowSeconds);

    // Window expired - reset the window and count this as the first message
    if (expired) {
      await resetRateLimitCounter(sessionId, 1);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: (current_time + windowSeconds) * 1000,
      };
    }

    // First message in a new session
    if (current_count === 0) {
      await resetRateLimitCounter(sessionId, 1);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: (current_time + windowSeconds) * 1000,
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

    // Increment counter (still within limit)
    await incrementRateLimitCounter(sessionId);
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
