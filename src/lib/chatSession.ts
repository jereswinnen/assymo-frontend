import type { ChatSession } from "@/types/chat";

const SESSION_STORAGE_KEY = "chatbot_session";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session: ChatSession = JSON.parse(stored);
      return session.sessionId;
    }

    const newSession: ChatSession = {
      sessionId: crypto.randomUUID(),
      createdAt: new Date(),
      messageCount: 0,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    return newSession.sessionId;
  } catch (error) {
    console.error("Failed to get session ID:", error);
    return crypto.randomUUID();
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

export function updateMessageCount(count: number): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session: ChatSession = JSON.parse(stored);
      session.messageCount = count;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (error) {
    console.error("Failed to update message count:", error);
  }
}
