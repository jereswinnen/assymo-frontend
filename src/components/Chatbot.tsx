"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, Trash2Icon, XIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";
import { clearSession, getSessionId } from "@/lib/chatSession";
import { Separator } from "./ui/separator";
import { Spinner } from "./ui/spinner";
import { CHATBOT_CONFIG } from "@/config/chatbot";
import { usePersistedMessages } from "@/hooks/usePersistedMessages";
import { useRateLimitCountdown } from "@/hooks/useRateLimitCountdown";

interface ChatbotProps {
  onClose?: () => void;
}

export default function Chatbot({ onClose }: ChatbotProps = {}) {
  const [input, setInput] = useState("");
  const [rateLimitError, setRateLimitError] = useState<{
    resetTime: number;
    remaining: number;
  } | null>(null);
  const [ipAddress, setIpAddress] = useState<string>("Loading...");
  const [backendMessageCount, setBackendMessageCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = getSessionId();

  // Load and persist messages with expiry
  const { initialMessages, isHydrated, saveMessages, clearMessages } =
    usePersistedMessages(sessionId);

  const { messages, sendMessage, status, clearError } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        sessionId,
      },
    }),
    onError: async (error) => {
      console.error("Chat error:", error);

      // When an error occurs, check if it's a rate limit error
      // Make a lightweight request to get rate limit status
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], sessionId }),
        });

        if (response.status === 429) {
          const data = await response.json();
          setRateLimitError({
            resetTime: data.resetTime,
            remaining: data.remaining,
          });
          setBackendMessageCount(CHATBOT_CONFIG.rateLimitMaxMessages);
        }
      } catch (e) {
        console.error("Failed to check rate limit:", e);
      }
    },
    onFinish: () => {
      // Update backend count after successful message
      setBackendMessageCount((prev) =>
        Math.min(prev + 1, CHATBOT_CONFIG.rateLimitMaxMessages),
      );
    },
  });

  // Persist messages to localStorage with timestamp
  useEffect(() => {
    saveMessages(messages);
  }, [messages, saveMessages]);

  // Fetch IP address for debugging
  useEffect(() => {
    fetch("/api/get-ip")
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unknown"));
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-clear rate limit error when reset time is reached
  const countdown = useRateLimitCountdown(
    rateLimitError,
    sessionId,
    () => {
      setRateLimitError(null);
      clearError();
    },
    setRateLimitError,
    setBackendMessageCount,
  );

  const handleClearConversation = () => {
    clearMessages();
    clearSession();
    setRateLimitError(null);
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready" || rateLimitError) return;

    // Enforce character limit
    if (input.length > CHATBOT_CONFIG.maxInputLength) return;

    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-full">
      {/* Header with clear and close buttons */}
      <div className="flex items-center justify-between text-foreground p-4 border-b">
        <p className="!mb-0 text-xl font-semibold">Chat</p>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Wis gesprek"
              title="Wis gesprek"
            >
              <Trash2Icon className="size-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 bg-muted text-muted-foreground rounded-full transition-colors"
              aria-label="Sluit chat"
            >
              <XIcon className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`text-base flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-2xl ${
                  message.role === "user"
                    ? "p-3 bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                <p>
                  {message.parts
                    .map((part) => (part.type === "text" ? part.text : ""))
                    .join("")}
                </p>
              </div>
              <div
                className={`text-xs text-muted-foreground ${
                  message.role === "user" ? "text-right mt-1" : "text-left mt-2"
                }`}
              >
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-2 p-3">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        {rateLimitError ? (
          <div className="text-center text-muted-foreground p-4">
            <p className="font-semibold">
              Rate limit bereikt ({CHATBOT_CONFIG.rateLimitMaxMessages}{" "}
              berichten /{" "}
              {Math.floor(CHATBOT_CONFIG.rateLimitWindowSeconds / 60)}m)
            </p>
            <p className="text-sm mt-1">Reset over: {countdown}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <InputGroup>
              <InputGroupTextarea
                ref={textareaRef}
                placeholder="Waarmee kunnen we je helpen?"
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Enforce character limit
                  if (newValue.length <= CHATBOT_CONFIG.maxInputLength) {
                    setInput(newValue);
                  }
                }}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={isLoading}
                maxLength={CHATBOT_CONFIG.maxInputLength}
              />
              <InputGroupAddon align="block-end">
                <InputGroupText className="text-xs text-muted-foreground">
                  {ipAddress}
                </InputGroupText>
                <InputGroupText className="ml-auto text-xs">
                  {backendMessageCount} / {CHATBOT_CONFIG.rateLimitMaxMessages}
                  {countdown && ` (reset: ${countdown})`}
                  {" • "}
                  {CHATBOT_CONFIG.maxInputLength - input.length}
                </InputGroupText>
                <Separator orientation="vertical" className="!h-4" />
                <InputGroupButton
                  type="submit"
                  variant="default"
                  className="rounded-full"
                  size="icon-xs"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? <Spinner className="size-4" /> : <ArrowUpIcon />}
                  <span className="sr-only">Verstuur bericht</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        )}
      </div>
    </div>
  );
}
