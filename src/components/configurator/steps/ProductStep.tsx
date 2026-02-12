"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { QuestionField, type QuestionConfig } from "../QuestionField";
import type { WizardAnswers } from "../Wizard";
import type { WizardStep } from "./QuestionStep";

interface ProductOption {
  slug: string;
  name: string;
}

interface ProductStepProps {
  products: ProductOption[];
  selectedProduct: string | null;
  answers: WizardAnswers;
  showQuestions?: boolean;
  onProductChange: (product: string) => void;
  onAnswerChange: (key: string, value: WizardAnswers[string]) => void;
  onQuestionsLoaded?: (questions: QuestionConfig[]) => void;
  onStepsLoaded?: (steps: WizardStep[]) => void;
  className?: string;
}

export function ProductStep({
  products,
  selectedProduct,
  answers,
  showQuestions = true,
  onProductChange,
  onAnswerChange,
  onQuestionsLoaded,
  onStepsLoaded,
  className,
}: ProductStepProps) {
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions when product changes
  useEffect(() => {
    if (!selectedProduct) {
      setQuestions([]);
      onQuestionsLoaded?.([]);
      onStepsLoaded?.([]);
      return;
    }

    async function fetchQuestions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/configurator/questions?product=${encodeURIComponent(selectedProduct!)}`
        );

        if (!response.ok) {
          throw new Error("Kon vragen niet laden");
        }

        const data = await response.json();
        const loadedQuestions = data.questions || [];
        setQuestions(loadedQuestions);
        onQuestionsLoaded?.(loadedQuestions);

        // Pass step data to parent if steps exist
        if (data.steps && Array.isArray(data.steps)) {
          onStepsLoaded?.(data.steps);
        } else {
          onStepsLoaded?.([]);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Er is iets misgegaan bij het laden van de vragen.");
        setQuestions([]);
        onQuestionsLoaded?.([]);
        onStepsLoaded?.([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [selectedProduct]);

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Product selector */}
      <Field className="max-w-md">
        <FieldLabel htmlFor="product-selector">
          Welk product zoekt u? *
        </FieldLabel>
        <Select
          value={selectedProduct || ""}
          onValueChange={onProductChange}
        >
          <SelectTrigger id="product-selector" className="w-full">
            <SelectValue placeholder="Selecteer een product..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.slug} value={product.slug}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-stone-500">
          <Spinner className="size-5 mr-2" />
          <span>Vragen laden...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dynamic questions (only when showQuestions is true, i.e. no config steps) */}
      {showQuestions && !isLoading && !error && questions.length > 0 && (
        <FieldGroup>
          {questions.map((question) => (
            <QuestionField
              key={question.question_key}
              question={question}
              value={answers[question.question_key]}
              onChange={onAnswerChange}
            />
          ))}
        </FieldGroup>
      )}

      {/* Empty state when product selected but no questions */}
      {showQuestions && !isLoading && !error && selectedProduct && questions.length === 0 && (
        <p className="text-sm text-stone-500">
          Geen aanvullende vragen voor dit product.
        </p>
      )}
    </div>
  );
}
