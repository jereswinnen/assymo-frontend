"use client";

import { cn } from "@/lib/utils";
import {
  BlocksIcon,
  CircleUserRoundIcon,
  NotepadTextDashedIcon,
} from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  className?: string;
}

const STEPS = [
  { number: 1, label: "Configuratie", icon: BlocksIcon },
  { number: 2, label: "Gegevens", icon: CircleUserRoundIcon },
  { number: 3, label: "Overzicht", icon: NotepadTextDashedIcon },
];

export function ProgressBar({ currentStep, className }: ProgressBarProps) {
  return (
    <nav aria-label="Progress" className={cn("flex gap-6", className)}>
      {STEPS.map((step) => {
        const Icon = step.icon;
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
              <Icon className="size-4" />
              <span>{step.label}</span>
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
