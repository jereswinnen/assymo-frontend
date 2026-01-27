"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useTracking } from "@/lib/tracking";
import { ProgressBar } from "./ProgressBar";
import { ProductStep } from "./steps/ProductStep";
import { ContactStep, validateContactDetails } from "./steps/ContactStep";
import { SummaryStep } from "./steps/SummaryStep";

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
  address: string;
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

export function Wizard({ products, initialProduct = null, className }: WizardProps) {
  const { track } = useTracking();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const hasTrackedStartRef = useRef(false);

  // Step 1: Product configuration
  const [selectedProduct, setSelectedProduct] = useState<string | null>(initialProduct);
  const [answers, setAnswers] = useState<WizardAnswers>({});

  // Step 2: Contact details
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    name: "",
    email: "",
    phone: "",
    address: "",
    newsletterOptIn: false,
  });

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submission complete state (to hide navigation on step 3)
  const [submissionComplete, setSubmissionComplete] = useState(false);

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
    // Clear answers when product changes
    setAnswers({});
    setValidationError(null);
  }, []);

  const handleAnswerChange = useCallback(
    (key: string, value: WizardAnswers[string]) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      setValidationError(null);
    },
    []
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

      // Track quote sent
      track("configurator_quote_sent", {
        product: selectedProduct,
        submission_id: data.submissionId,
      });

      // Track appointment booked if applicable
      if (data.appointmentDate && data.appointmentTime) {
        track("configurator_appointment_booked", {
          product: selectedProduct,
          date: data.appointmentDate,
          time: data.appointmentTime,
        });
      }
    },
    [track, selectedProduct]
  );

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      return selectedProduct !== null;
    }
    if (currentStep === 2) {
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

      // Track step 1 completed
      track("configurator_step_completed", {
        step: 1,
        product: selectedProduct,
      });

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const error = validateContactDetails(contactDetails);
      if (error) {
        setValidationError(error);
        return;
      }

      // Track step 2 completed
      track("configurator_step_completed", {
        step: 2,
        product: selectedProduct,
      });

      setCurrentStep(3);
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

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <ProductStep
            products={products}
            selectedProduct={selectedProduct}
            answers={answers}
            onProductChange={handleProductChange}
            onAnswerChange={handleAnswerChange}
          />
        )}

        {currentStep === 2 && (
          <ContactStep
            contactDetails={contactDetails}
            onChange={handleContactChange}
          />
        )}

        {currentStep === 3 && (
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

      {/* Navigation Buttons - Hide on step 3 when submission is complete */}
      {!(currentStep === 3 && submissionComplete) && (
        <div className="flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            Terug
          </Button>

          {currentStep < 3 && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2 bg-accent-dark text-accent-light hover:bg-accent-dark/90"
            >
              Volgende
              <ArrowRightIcon className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
