"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircleMoreIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chatbot from "@/components/Chatbot";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        ref={buttonRef}
        onClick={handleToggle}
        // className="fixed bottom-6 right-6 size-12 rounded-full shadow-lg z-40 md:size-16"
        className={`
          fixed bottom-6 right-6 size-12 rounded-full z-40 md:size-16
          ${isOpen ? "shadow-none" : "shadow-lg"}
        `}
        size="icon"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XIcon className="size-4 md:size-6" />
        ) : (
          <MessageCircleMoreIcon className="size-4 md:size-6" />
        )}
      </Button>

      {/* Chatbot Dialog */}
      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Chat widget"
          aria-modal="false"
          className={`
            fixed z-50 bg-background shadow-lg border rounded-2xl
            transition-all duration-200 ease-out
            ${
              isOpen
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }
            /* Mobile: Full screen */
            inset-4
            /* Desktop: Bottom-right floating */
            md:inset-auto md:bottom-6 md:right-6 md:w-[450px] md:h-[700px]
          `}
        >
          <Chatbot onClose={handleClose} />
        </div>
      )}
    </>
  );
}
