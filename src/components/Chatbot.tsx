"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";
import { usePersistedChat } from "@/hooks/usePersistedChat";
import type { Message } from "@/types/chat";
import { clearSession } from "@/lib/chatSession";
import { Separator } from "./ui/separator";

interface ChatbotProps {
  onClose?: () => void;
}

export default function Chatbot({ onClose }: ChatbotProps = {}) {
  const { messages, addMessage, clearMessages, isHydrated } =
    usePersistedChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputValue("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Bedankt voor je vraag! Dit is een dummy reactie. In de echte versie zou hier een API-response komen.",
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
    }, 1000);
  };

  const handleClearConversation = () => {
    clearMessages();
    clearSession();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
                <p>{message.content}</p>
              </div>
              <div
                className={`text-xs text-muted-foreground ${
                  message.role === "user" ? "text-right mt-1" : "text-left mt-2"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <InputGroupTextarea
              ref={textareaRef}
              placeholder="Waarmee kunnen we je helpen?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                type="button"
                variant="outline"
                className="rounded-full"
                size="icon-xs"
              >
                <PlusIcon />
              </InputGroupButton>
              <InputGroupText className="ml-auto">
                8/10 berichten
              </InputGroupText>
              <Separator orientation="vertical" className="!h-4" />
              <InputGroupButton
                type="submit"
                variant="default"
                className="rounded-full bg-accent-light text-accent-dark"
                size="icon-xs"
                disabled={!inputValue.trim()}
              >
                <ArrowUpIcon />
                <span className="sr-only">Verstuur bericht</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  );
}
