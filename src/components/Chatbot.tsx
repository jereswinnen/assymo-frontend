"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpIcon, Plus as IconPlus, X } from "lucide-react";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";

// Dummy chat data - used as initial state
const initialMessages = [
  {
    id: 1,
    role: "user" as const,
    content: "Wat zijn houten tuingebouwen?",
    timestamp: new Date("2025-01-13T10:00:00"),
  },
  {
    id: 2,
    role: "assistant" as const,
    content:
      "Houten tuingebouwen zijn constructies in de tuin gemaakt van hout, zoals tuinhuisjes, overkappingen, pergola's, carports en schuren. Ze worden vaak gebruikt als extra opslagruimte, werkplaats of als sfeervolle ontspanningsruimte in de tuin.",
    timestamp: new Date("2025-01-13T10:00:15"),
  },
  {
    id: 3,
    role: "user" as const,
    content: "Wat kost een houten tuingebouw gemiddeld?",
    timestamp: new Date("2025-01-13T10:01:00"),
  },
  {
    id: 4,
    role: "assistant" as const,
    content:
      "De kosten van een houten tuingebouw variëren sterk afhankelijk van de grootte, het type hout en de afwerking. Een eenvoudig tuinhuisje begint rond €1.500, terwijl een hoogwaardige overkapping of tuinhuis tussen €3.000 en €10.000 kan kosten. Maatwerk en luxe uitvoeringen kunnen nog duurder zijn.",
    timestamp: new Date("2025-01-13T10:01:20"),
  },
  {
    id: 5,
    role: "user" as const,
    content: "Welke factoren beïnvloeden de prijs?",
    timestamp: new Date("2025-01-13T10:02:30"),
  },
  {
    id: 6,
    role: "assistant" as const,
    content:
      "De belangrijkste factoren zijn: de afmetingen van het gebouw, de houtsoort (grenen, lariks, eiken), de dikte van het hout, isolatie, fundering, dakbedekking, ramen en deuren, behandeling tegen weersinvloeden, en of het om standaard of maatwerk gaat. Ook de plaatsing en montage kunnen de totaalprijs beïnvloeden.",
    timestamp: new Date("2025-01-13T10:02:45"),
  },
];

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

interface ChatbotProps {
  onClose?: () => void;
}

export default function Chatbot({ onClose }: ChatbotProps = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
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

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate assistant response (dummy behavior)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content:
          "Bedankt voor je vraag! Dit is een dummy reactie. In de echte versie zou hier een API-response komen.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with close button */}
      <div className="flex items-center justify-between text-foreground p-4 border-b">
        <p className="!mb-0 text-xl font-semibold">Chat</p>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 bg-muted text-muted-foreground rounded-full transition-colors"
            aria-label="Sluit chat"
          >
            <X className="h-5 w-5" />
          </button>
        )}
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
                <IconPlus />
              </InputGroupButton>
              <InputGroupText className="ml-auto">52% used</InputGroupText>
              <InputGroupButton
                type="submit"
                variant="default"
                className="rounded-full"
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
