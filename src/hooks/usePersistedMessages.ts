import { useEffect, useState } from "react";
import { CHATBOT_COMPUTED } from "@/config/chatbot";

/**
 * Custom hook to manage persisted chat messages in localStorage
 * Handles loading, saving, and expiry of messages
 */
export function usePersistedMessages(sessionId: string) {
  const [isHydrated, setIsHydrated] = useState(false);
  const storageKey = `ai-chat-${sessionId}`;
  const timestampKey = `ai-chat-timestamp-${sessionId}`;

  // Load persisted messages on mount with expiry check
  const [initialMessages, setInitialMessages] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(timestampKey);

      if (!stored || !timestamp) return [];

      // Check if messages have expired
      const messageAge = Date.now() - parseInt(timestamp);
      if (messageAge > CHATBOT_COMPUTED.messageRetentionMs) {
        // Messages expired, clear them
        localStorage.removeItem(storageKey);
        localStorage.removeItem(timestampKey);
        return [];
      }

      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Save messages to localStorage
  const saveMessages = (messages: any[]) => {
    if (isHydrated && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
      // Set timestamp only once
      if (!localStorage.getItem(timestampKey)) {
        localStorage.setItem(timestampKey, Date.now().toString());
      }
    }
  };

  // Clear messages from localStorage
  const clearMessages = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(timestampKey);
  };

  return {
    initialMessages,
    isHydrated,
    saveMessages,
    clearMessages,
  };
}
