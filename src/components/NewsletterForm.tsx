"use client";

import { FormEvent, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { cn } from "@/lib/utils";
import { Spinner } from "./ui/spinner";
import { CheckIcon, MailCheckIcon, SendIcon } from "lucide-react";

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "already-subscribed" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isSuccess = status === "success" || status === "already-subscribed";
  const isSubmitting = status === "submitting";
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isSubmitting || isSuccess || !isValidEmail) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er is iets misgegaan");
      }

      if (data.alreadySubscribed) {
        setStatus("already-subscribed");
      } else {
        setStatus("success");
      }
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Er is iets misgegaan",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="*:mb-0!">
        <p className="text-lg font-medium text-stone-800">
          Abonneer je op onze nieuwsbrief
        </p>
        <p className="text-sm text-stone-600">
          Ontvang handige weetjes en blijf op de hoogte van promoties.
        </p>
      </div>
      <InputGroup className="w-[60%] bg-white">
        <InputGroupInput
          type="email"
          placeholder="Vul je e-mailadres in..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-invalid={status === "error"}
          disabled={isSubmitting || isSuccess}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            variant="default"
            disabled={isSubmitting || (!isSuccess && !isValidEmail)}
            className={cn(
              "text-accent-light bg-accent-dark transition-colors duration-250 hover:text-accent-dark hover:bg-accent-light",
              isSubmitting &&
                "text-stone-600 bg-stone-200 hover:text-stone-600 hover:bg-stone-200",
              isSuccess &&
                "text-stone-600 bg-stone-200 hover:text-stone-600 hover:bg-stone-200",
            )}
          >
            {isSubmitting && (
              <>
                <Spinner className="size-3" />
                <span>Laden...</span>
              </>
            )}
            {isSuccess && (
              <>
                <CheckIcon className="size-3" />
                <span>Gelukt!</span>
              </>
            )}
            {!isSubmitting && !isSuccess && (
              <>
                <MailCheckIcon className="size-3" />
                <span>Abonneren</span>
              </>
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </form>
  );
}
