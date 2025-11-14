"use client";

import { useState, useEffect, useCallback } from "react";
import type { Message } from "@/types/chat";
import { updateMessageCount } from "@/lib/chatSession";

const MESSAGES_STORAGE_KEY = "chatbot_messages";
const EXPIRY_DAYS = 7;

function isExpired(timestamp: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > EXPIRY_DAYS;
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    const messages: Message[] = parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    const validMessages = messages.filter(
      (msg) => !isExpired(msg.timestamp)
    );

    if (validMessages.length !== messages.length) {
      localStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(validMessages)
      );
    }

    return validMessages;
  } catch (error) {
    console.error("Failed to load messages:", error);
    return [];
  }
}

function saveMessages(messages: Message[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    updateMessageCount(messages.length);
  } catch (error) {
    console.error("Failed to save messages:", error);
  }
}

export function usePersistedChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadMessages();
    setMessages(loaded);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveMessages(messages);
  }, [messages, isHydrated]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
    isHydrated,
  };
}
