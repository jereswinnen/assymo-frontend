"use client";

import { ArrowUpIcon, Plus as IconPlus } from "lucide-react";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

// Dummy chat data
const dummyMessages = [
  {
    id: 1,
    role: "user",
    content: "What services do you offer?",
    timestamp: new Date("2025-01-13T10:00:00"),
  },
  {
    id: 2,
    role: "assistant",
    content:
      "We offer a wide range of IT solutions including cloud services, cybersecurity, and software development. How can I help you today?",
    timestamp: new Date("2025-01-13T10:00:15"),
  },
  {
    id: 3,
    role: "user",
    content: "Tell me more about your cloud services",
    timestamp: new Date("2025-01-13T10:01:00"),
  },
  {
    id: 4,
    role: "assistant",
    content:
      "Our cloud services include infrastructure management, cloud migration, and scalable hosting solutions. We work with major providers like AWS, Azure, and Google Cloud.",
    timestamp: new Date("2025-01-13T10:01:20"),
  },
];

export default function Chatbot() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Chatbot</h2>

      <div className="bg-blue-200 flex-1 overflow-y-auto p-4 space-y-4">
        {dummyMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p>{message.content}</p>
              </div>
              <div
                className={`text-xs text-muted-foreground mt-1 px-2 ${
                  message.role === "user" ? "text-right" : "text-left"
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
      </div>

      <InputGroup>
        <InputGroupTextarea placeholder="Waarmee kunnen we je helpen?" />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            variant="outline"
            className="rounded-full"
            size="icon-xs"
          >
            <IconPlus />
          </InputGroupButton>
          <InputGroupText className="ml-auto">52% used</InputGroupText>
          <InputGroupButton
            variant="default"
            className="rounded-full"
            size="icon-xs"
            disabled
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
