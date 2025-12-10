"use client";

import { useState, useEffect, useRef } from "react";
import { MessagesSquareIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chatbot from "@/components/Chatbot";

export default function ChatbotWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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

  // Handle external open trigger (e.g., from CTA buttons)
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
      setIsClosing(false);
    };

    window.addEventListener("openChatbot", handleOpenChatbot);
    return () => window.removeEventListener("openChatbot", handleOpenChatbot);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        !isClosing &&
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isClosing]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setIsClosing(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      buttonRef.current?.focus();
    }, 300); // Match animation duration
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        ref={buttonRef}
        onClick={handleToggle}
        className={`
          cursor-pointer z-40 fixed bottom-0 md:bottom-6 right-4 md:right-6 size-16 md:size-14 rounded-full bg-accent-light text-accent-dark hover:bg-white hover:border hover:scale-110
          ${isOpen ? "shadow-none" : "shadow-lg"}
        `}
        size="icon"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XIcon className="size-7 md:size-6" />
        ) : (
          <MessagesSquareIcon className="size-7 md:size-6" />
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
            transition-all duration-300 origin-bottom-right
            ${
              isClosing
                ? "animate-out fade-out slide-out-to-right-4 zoom-out-95"
                : "animate-in fade-in slide-in-from-right-4 zoom-in-95"
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
