"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTracking } from "@/lib/tracking";
import { actionVariants } from "@/components/shared/Action";
import { ProgressBar } from "./ProgressBar";
import { ProductStep } from "./steps/ProductStep";
import { ContactStep, validateContactDetails } from "./steps/ContactStep";
import { SummaryStep } from "./steps/SummaryStep";
import { QuestionStep, type WizardStep } from "./steps/QuestionStep";
import type { QuestionConfig } from "./QuestionField";

// =============================================================================
// Types
// =============================================================================

export type WizardAnswers = Record<
  string,
  string | string[] | number | undefined
>;

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  newsletterOptIn: boolean;
}

interface ProductOption {
  slug: string;
  name: string;
}

interface WizardProps {
  products: ProductOption[];
  initialProduct?: string | null;
  className?: string;
}

// =============================================================================
// Wizard Component
// =============================================================================

export function Wizard({
  products,
  initialProduct = null,
  className,
}: WizardProps) {
  const { track } = useTracking();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const hasTrackedStartRef = useRef(false);

  // Step 1: Product configuration
  const [selectedProduct, setSelectedProduct] = useState<string | null>(
    initialProduct,
  );
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Dynamic config steps from API
  const [configSteps, setConfigSteps] = useState<WizardStep[]>([]);

  // Contact details
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    name: "",
    email: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
    newsletterOptIn: false,
  });

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submission complete state
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // ==========================================================================
  // Computed step layout
  // ==========================================================================

  const hasConfigSteps = configSteps.length > 0;

  // Total steps: product + N config steps + contact + summary
  // Without config steps: product + contact + summary = 3
  const totalSteps = hasConfigSteps ? 2 + configSteps.length : 3;
  const contactStepNum = hasConfigSteps ? 2 + configSteps.length : 2;
  const summaryStepNum = totalSteps;

  // Progress bar steps
  const progressSteps = useMemo(() => {
    if (!hasConfigSteps) {
      return [
        { number: 1, label: "Configuratie" },
        { number: 2, label: "Gegevens" },
        { number: 3, label: "Overzicht" },
      ];
    }
    return [
      { number: 1, label: "Product" },
      ...configSteps.map((s, i) => ({ number: 2 + i, label: s.name })),
      { number: contactStepNum, label: "Gegevens" },
      { number: summaryStepNum, label: "Overzicht" },
    ];
  }, [hasConfigSteps, configSteps, contactStepNum, summaryStepNum]);

  // ==========================================================================
  // Analytics: Track wizard started on mount
  // ==========================================================================

  useEffect(() => {
    if (!hasTrackedStartRef.current) {
      hasTrackedStartRef.current = true;
      track("configurator_started", {
        product: initialProduct || undefined,
      });
    }
  }, [track, initialProduct]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleProductChange = useCallback((product: string) => {
    setSelectedProduct(product);
    setAnswers({});
    setQuestions([]);
    setConfigSteps([]);
    setQuestionsLoading(true);
    setValidationError(null);
  }, []);

  const handleQuestionsLoaded = useCallback((loadedQuestions: QuestionConfig[]) => {
    setQuestions(loadedQuestions);
    setQuestionsLoading(false);
  }, []);

  const handleStepsLoaded = useCallback((steps: WizardStep[]) => {
    setConfigSteps(steps);
  }, []);

  const handleAnswerChange = useCallback(
    (key: string, value: WizardAnswers[string]) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      setValidationError(null);
    },
    [],
  );

  const handleContactChange = useCallback((details: ContactDetails) => {
    setContactDetails(details);
    setValidationError(null);
  }, []);

  const handleSubmissionComplete = useCallback(
    (data: {
      submissionId: string;
      appointmentId?: number;
      appointmentDate?: string;
      appointmentTime?: string;
    }) => {
      setSubmissionComplete(true);

      track("configurator_quote_sent", {
        product: selectedProduct,
        submission_id: data.submissionId,
      });

      if (data.appointmentDate && data.appointmentTime) {
        track("configurator_appointment_booked", {
          product: selectedProduct,
          date: data.appointmentDate,
          time: data.appointmentTime,
        });
      }
    },
    [track, selectedProduct],
  );

  // ==========================================================================
  // Navigation
  // ==========================================================================

  /**
   * Get the questions for the current step (config step or all questions)
   */
  const getCurrentStepQuestions = (): QuestionConfig[] => {
    if (hasConfigSteps && currentStep >= 2 && currentStep < contactStepNum) {
      const stepIndex = currentStep - 2;
      return configSteps[stepIndex]?.questions || [];
    }
    // Step 1 (product step without config steps) uses all questions
    if (!hasConfigSteps && currentStep === 1) {
      return questions;
    }
    return [];
  };

  /**
   * Validate required questions for a given list
   */
  const validateQuestions = (questionList: QuestionConfig[]): string | null => {
    for (const question of questionList) {
      if (!question.required) continue;
      const answer = answers[question.question_key];
      if (answer === undefined || answer === null || answer === "") {
        return `Vul "${question.label}" in`;
      }
      if (Array.isArray(answer) && answer.length === 0) {
        return `Selecteer minstens één optie voor "${question.label}"`;
      }
    }
    return null;
  };

  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      if (!selectedProduct || questionsLoading) return false;
      if (!hasConfigSteps) {
        return validateQuestions(questions) === null;
      }
      return true; // Product selected is enough when config steps exist
    }
    if (hasConfigSteps && currentStep >= 2 && currentStep < contactStepNum) {
      return validateQuestions(getCurrentStepQuestions()) === null;
    }
    if (currentStep === contactStepNum) {
      return validateContactDetails(contactDetails) === null;
    }
    return false;
  };

  const handleNext = () => {
    setValidationError(null);

    if (currentStep === 1) {
      if (!selectedProduct) {
        setValidationError("Selecteer eerst een product");
        return;
      }

      if (!hasConfigSteps) {
        const questionError = validateQuestions(questions);
        if (questionError) {
          setValidationError(questionError);
          return;
        }
      }

      track("configurator_step_completed", {
        step: 1,
        step_name: "Product",
        product: selectedProduct,
      });

      setCurrentStep(2);
      return;
    }

    // Config steps (2 through contactStepNum - 1)
    if (hasConfigSteps && currentStep >= 2 && currentStep < contactStepNum) {
      const questionError = validateQuestions(getCurrentStepQuestions());
      if (questionError) {
        setValidationError(questionError);
        return;
      }

      const stepIndex = currentStep - 2;
      track("configurator_step_completed", {
        step: currentStep,
        step_name: configSteps[stepIndex]?.name,
        product: selectedProduct,
      });

      setCurrentStep(currentStep + 1);
      return;
    }

    if (currentStep === contactStepNum) {
      const error = validateContactDetails(contactDetails);
      if (error) {
        setValidationError(error);
        return;
      }

      track("configurator_step_completed", {
        step: currentStep,
        step_name: "Gegevens",
        product: selectedProduct,
      });

      setCurrentStep(summaryStepNum);
      return;
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  // Determine what to render for the current step
  const isProductStep = currentStep === 1;
  const isConfigStep = hasConfigSteps && currentStep >= 2 && currentStep < contactStepNum;
  const isContactStep = currentStep === contactStepNum;
  const isSummaryStep = currentStep === summaryStepNum;

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} steps={progressSteps} />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {isProductStep && (
          <ProductStep
            products={products}
            selectedProduct={selectedProduct}
            answers={answers}
            showQuestions={!hasConfigSteps}
            onProductChange={handleProductChange}
            onAnswerChange={handleAnswerChange}
            onQuestionsLoaded={handleQuestionsLoaded}
            onStepsLoaded={handleStepsLoaded}
          />
        )}

        {isConfigStep && (
          <QuestionStep
            step={configSteps[currentStep - 2]}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}

        {isContactStep && (
          <ContactStep
            contactDetails={contactDetails}
            onChange={handleContactChange}
          />
        )}

        {isSummaryStep && (
          <SummaryStep
            selectedProduct={selectedProduct}
            products={products}
            answers={answers}
            contactDetails={contactDetails}
            onSubmissionComplete={handleSubmissionComplete}
          />
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {validationError}
        </div>
      )}

      {/* Navigation Buttons */}
      {!(isSummaryStep && submissionComplete) && (
        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={actionVariants({ variant: "secondary" })}
          >
            Terug
          </button>

          {currentStep < summaryStepNum && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className={actionVariants({ variant: "primary" })}
            >
              Volgende
            </button>
          )}
        </div>
      )}
    </div>
  );
}
