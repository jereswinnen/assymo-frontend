import { useEffect, useState } from "react";
import { CHATBOT_CONFIG } from "@/config/chatbot";

interface RateLimitError {
  resetTime: number;
  remaining: number;
}

/**
 * Custom hook to manage rate limit countdown timer
 * Automatically checks backend when timer expires and clears error state
 */
export function useRateLimitCountdown(
  rateLimitError: RateLimitError | null,
  sessionId: string,
  onClear: () => void,
  onUpdate: (error: RateLimitError) => void,
  setBackendMessageCount: (count: number) => void,
) {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!rateLimitError) {
      setCountdown("");
      return;
    }

    const updateCountdown = async () => {
      const now = Date.now();
      if (now >= rateLimitError.resetTime) {
        // Timer expired - verify with backend that window has actually expired
        try {
          const response = await fetch("/api/rate-limit-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });

          const data = await response.json();

          // If backend confirms window expired (allowed = true), clear the error
          if (data.allowed) {
            setBackendMessageCount(data.currentCount || 0);
            onClear(); // Clear error state and call clearError()
          }
          // If still rate limited, update with backend's timing
          else {
            onUpdate({
              resetTime: data.resetTime,
              remaining: data.remaining,
            });
            setBackendMessageCount(
              data.currentCount || CHATBOT_CONFIG.rateLimitMaxMessages,
            );
          }
        } catch (e) {
          console.error("Failed to verify rate limit expiry:", e);
          // On error, optimistically clear the limit
          setBackendMessageCount(0);
          onClear();
        }
      } else {
        const diff = Math.max(0, rateLimitError.resetTime - now);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setCountdown(`${hours}u ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${seconds}s`);
        }
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [rateLimitError, sessionId, onClear, onUpdate, setBackendMessageCount]);

  return countdown;
}
