import { useEffect, useState } from "react";
import { CHATBOT_COMPUTED } from "@/config/chatbot";

/**
 * Custom hook to manage persisted chat messages
 * Loads from database first (source of truth), falls back to localStorage
 */
export function usePersistedMessages(sessionId: string) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const storageKey = `ai-chat-${sessionId}`;
  const timestampKey = `ai-chat-timestamp-${sessionId}`;
  const [initialMessages, setInitialMessages] = useState<any[]>([]);

  // Load messages from database on mount
  useEffect(() => {
    async function loadMessages() {
      try {
        // Try loading from database first (source of truth)
        const response = await fetch("/api/chat-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const { messages: dbMessages } = await response.json();
          setInitialMessages(dbMessages);
          console.log(`Loaded ${dbMessages.length} messages from database`);
        } else {
          // Fallback to localStorage if DB fails
          const localMessages = loadFromLocalStorage();
          setInitialMessages(localMessages);
          console.log(
            `Fallback: loaded ${localMessages.length} messages from localStorage`,
          );
        }
      } catch (error) {
        console.error("Failed to load chat history from database:", error);
        // Fallback to localStorage on error
        const localMessages = loadFromLocalStorage();
        setInitialMessages(localMessages);
        console.log(
          `Error fallback: loaded ${localMessages.length} messages from localStorage`,
        );
      } finally {
        setIsLoading(false);
        setIsHydrated(true);
      }
    }

    loadMessages();
  }, [sessionId]);

  // Helper to load from localStorage
  const loadFromLocalStorage = () => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(timestampKey);

      if (!stored || !timestamp) return [];

      // Check if messages have expired
      const messageAge = Date.now() - parseInt(timestamp);
      if (messageAge > CHATBOT_COMPUTED.messageRetentionMs) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(timestampKey);
        return [];
      }

      return JSON.parse(stored);
    } catch {
      return [];
    }
  };

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
    isLoading,
    saveMessages,
    clearMessages,
  };
}
