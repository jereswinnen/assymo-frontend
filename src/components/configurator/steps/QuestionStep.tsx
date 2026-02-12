"use client";

import { cn } from "@/lib/utils";
import { FieldGroup } from "@/components/ui/field";
import { QuestionField, type QuestionConfig } from "../QuestionField";
import type { WizardAnswers } from "../Wizard";

export interface WizardStep {
  id: string;
  name: string;
  description: string | null;
  questions: QuestionConfig[];
}

interface QuestionStepProps {
  step: WizardStep;
  answers: WizardAnswers;
  onAnswerChange: (key: string, value: WizardAnswers[string]) => void;
  className?: string;
}

export function QuestionStep({
  step,
  answers,
  onAnswerChange,
  className,
}: QuestionStepProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h2 className="text-xl font-semibold">{step.name}</h2>
        {step.description && (
          <p className="mt-1 text-sm text-stone-500">{step.description}</p>
        )}
      </div>

      {step.questions.length > 0 && (
        <FieldGroup>
          {step.questions.map((question) => (
            <QuestionField
              key={question.question_key}
              question={question}
              value={answers[question.question_key]}
              onChange={onAnswerChange}
            />
          ))}
        </FieldGroup>
      )}
    </div>
  );
}
