"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, XIcon } from "lucide-react";
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
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Exo_2 } from "next/font/google";
import Logo from "./Logo";

interface ChatbotProps {
  onClose?: () => void;
}

export default function Chatbot({ onClose }: ChatbotProps = {}) {
  const [input, setInput] = useState("");
  const [rateLimitError, setRateLimitError] = useState<{
    resetTime: number;
    remaining: number;
  } | null>(null);
  const [backendMessageCount, setBackendMessageCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = getSessionId();

  // Load and persist messages with expiry
  const {
    initialMessages,
    isHydrated,
    isLoading: isLoadingMessages,
    saveMessages,
    clearMessages,
  } = usePersistedMessages(sessionId);

  const { messages, setMessages, sendMessage, status, clearError } = useChat({
    id: sessionId,
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

  // Load messages from database when they're ready
  useEffect(() => {
    if (!isLoadingMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      console.log(
        `Set ${initialMessages.length} messages from database into useChat`,
      );
    }
  }, [initialMessages, isLoadingMessages, setMessages]);

  // Load rate limit status on mount
  useEffect(() => {
    async function loadRateLimitStatus() {
      try {
        const response = await fetch("/api/rate-limit-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          const currentCount =
            CHATBOT_CONFIG.rateLimitMaxMessages - data.remaining;
          setBackendMessageCount(currentCount);
          console.log(
            `Loaded rate limit: ${currentCount}/${CHATBOT_CONFIG.rateLimitMaxMessages}`,
          );
        }
      } catch (error) {
        console.error("Failed to load rate limit status:", error);
      }
    }

    loadRateLimitStatus();
  }, [sessionId]);

  // Persist messages to localStorage with timestamp
  useEffect(() => {
    saveMessages(messages);
  }, [messages, saveMessages]);

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

  const isThinking = status === "submitted" || status === "streaming";

  // Show loading spinner only when status is submitted (before streaming starts)
  const showLoadingSpinner = status === "submitted";

  // Calculate remaining messages
  const remainingMessages =
    CHATBOT_CONFIG.rateLimitMaxMessages - backendMessageCount;

  return (
    <div className="flex flex-col h-full">
      {/* Header with close button */}
      <div className="flex items-center justify-end text-foreground p-4">
        {onClose && (
          <button
            onClick={onClose}
            className="cursor-pointer p-1 bg-muted text-muted-foreground rounded-full transition-colors"
            aria-label="Sluit chat"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 flex-col gap-6 overflow-y-auto p-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            {/* Show suggested questions when no messages */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col justify-center gap-4">
                <header>
                  <Logo className="w-32 text-accent-dark" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Waarmee kunnen we je helpen?
                  </p>
                </header>
                <div className="grid grid-cols-2 gap-3">
                  {CHATBOT_CONFIG.suggestedQuestions.map((question, index) => (
                    <a
                      key={index}
                      onClick={() => {
                        sendMessage({ text: question });
                      }}
                      className="cursor-pointer text-left flex text-sm font-medium rounded-lg p-2 bg-stone-100 hover:bg-stone-200 transition-colors"
                      //disabled={status !== "ready"}
                    >
                      {question}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => {
              // For assistant messages, check if this is the last one and if we're currently streaming
              const isLastMessage = index === messages.length - 1;
              const isStreamingThisMessage =
                isLastMessage &&
                message.role === "assistant" &&
                status === "streaming";

              return (
                <div
                  key={message.id}
                  className={`text-sm flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%] flex flex-col gap-2">
                    <div
                      className={`rounded-full ${
                        message.role === "user"
                          ? "px-3 py-2 bg-primary text-primary-foreground"
                          : ""
                      }`}
                    >
                      <p>
                        {message.parts
                          .map((part) =>
                            part.type === "text" ? part.text : "",
                          )
                          .join("")}
                      </p>
                    </div>
                    {/* Always show footer for messages, but change content based on streaming state */}
                    <div
                      className={`flex items-center gap-1.5 text-xs text-muted-foreground ${
                        message.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      {message.role === "assistant" && (
                        <>
                          <span className="font-medium text-foreground">
                            Assymo
                          </span>
                          <Separator
                            orientation="vertical"
                            className="size-2"
                          />
                        </>
                      )}
                      {/* Show spinner while streaming, timestamp when done */}
                      {isStreamingThisMessage ? (
                        <Spinner className="size-3" />
                      ) : (
                        <time>
                          {(message as any).createdAt
                            ? new Date(
                                (message as any).createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </time>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {showLoadingSpinner && (
              <div className="text-sm flex justify-start">
                <div className="max-w-[80%] flex flex-col gap-2">
                  <div className="flex items-center">
                    <Spinner className="size-5" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
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
                placeholder="Stel je vraag..."
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
                disabled={isThinking}
                maxLength={CHATBOT_CONFIG.maxInputLength}
              />
              <InputGroupAddon align="block-end">
                <InputGroupText className="text-xs text-muted-foreground">
                  {remainingMessages}{" "}
                  {remainingMessages === 1 ? "bericht" : "berichten"} resterend
                  {countdown && ` (reset: ${countdown})`}
                </InputGroupText>
                <InputGroupText className="ml-auto text-xs text-muted-foreground">
                  {CHATBOT_CONFIG.maxInputLength - input.length}
                </InputGroupText>
                <Separator orientation="vertical" className="!h-4" />
                <InputGroupButton
                  type="submit"
                  variant="default"
                  className="cursor-pointer rounded-full"
                  size="icon-xs"
                  disabled={!input.trim() || isThinking}
                >
                  {isThinking ? (
                    <Spinner className="size-4" />
                  ) : (
                    <ArrowUpIcon />
                  )}
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
