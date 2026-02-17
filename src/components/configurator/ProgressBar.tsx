"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressStep {
  number: number;
  label: string;
}

interface ProgressBarProps {
  currentStep: number;
  steps?: ProgressStep[];
  className?: string;
}

const DEFAULT_STEPS: ProgressStep[] = [
  { number: 1, label: "Configuratie" },
  { number: 2, label: "Gegevens" },
  { number: 3, label: "Overzicht" },
];

export function ProgressBar({
  currentStep,
  steps = DEFAULT_STEPS,
  className,
}: ProgressBarProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn("flex flex-col gap-0.5 text-right", className)}
    >
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <div
            key={step.number}
            className={cn(
              "flex items-center justify-end gap-1.5 py-1 text-[13px] transition-colors",
              isCompleted && "text-emerald-500",
              isActive && "text-stone-900 font-medium",
              !isActive && !isCompleted && "text-stone-300",
            )}
            aria-current={isActive ? "step" : undefined}
          >
            {isCompleted ? (
              <Check className="size-4 shrink-0" strokeWidth={2.5} />
            ) : isActive ? (
              <span className="size-[6px] shrink-0 rounded-full bg-stone-900" />
            ) : null}

            <span>{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
