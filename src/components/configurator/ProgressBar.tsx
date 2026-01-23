"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  className?: string;
}

const STEPS = [
  { number: 1, label: "Product" },
  { number: 2, label: "Gegevens" },
  { number: 3, label: "Offerte" },
];

export function ProgressBar({ currentStep, className }: ProgressBarProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.number}
              className={cn(
                "flex items-center",
                !isLast && "flex-1"
              )}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted && "border-accent-dark bg-accent-dark text-white",
                    isCurrent && "border-accent-dark bg-white text-accent-dark",
                    !isCompleted && !isCurrent && "border-stone-300 bg-white text-stone-400"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    isCompleted && "text-accent-dark",
                    isCurrent && "text-accent-dark",
                    !isCompleted && !isCurrent && "text-stone-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 transition-colors",
                    isCompleted ? "bg-accent-dark" : "bg-stone-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
