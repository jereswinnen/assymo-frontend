"use client";

import { cn } from "@/lib/utils";

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
    <nav aria-label="Progress" className={cn("flex gap-6", className)}>
      {steps.map((step) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <div key={step.number} className="flex-1 flex flex-col gap-3">
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm",
                isCompleted && "text-accent-dark",
                isActive && "text-stone-800 font-medium",
                !isActive && !isCompleted && "text-stone-600 font-normal"
              )}
            >
              <span className="truncate">{step.label}</span>
            </div>
            <div
              className={cn(
                "h-0.5",
                isCompleted && "bg-accent-light",
                isActive && "bg-stone-500",
                !isActive && !isCompleted && "bg-stone-200"
              )}
              aria-current={isActive ? "step" : undefined}
            />
          </div>
        );
      })}
    </nav>
  );
}
