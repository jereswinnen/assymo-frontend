"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FieldGroup } from "@/components/ui/field";
import { isQuestionVisible } from "@/lib/configurator/visibility";
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
  const visibleQuestions = useMemo(
    () =>
      step.questions
        .filter((q) => isQuestionVisible(q.visibility_rules, answers))
        .map((q) => {
          if (!q.options) return q;
          const visibleOpts = q.options.filter((opt) =>
            isQuestionVisible(opt.visibility_rules, answers),
          );
          return visibleOpts.length === q.options.length
            ? q
            : { ...q, options: visibleOpts };
        }),
    [step.questions, answers],
  );

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h2 className="text-xl font-semibold">{step.name}</h2>
        {step.description && (
          <p className="mt-1 text-sm text-stone-500">{step.description}</p>
        )}
      </div>

      {visibleQuestions.length > 0 && (
        <FieldGroup>
          {visibleQuestions.map((question) => (
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
