"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { ProductStep } from "./steps/ProductStep";
import { ContactStep, validateContactDetails } from "./steps/ContactStep";
import { SummaryStep } from "./steps/SummaryStep";

// =============================================================================
// Types
// =============================================================================

export type WizardAnswers = Record<
  string,
  string | string[] | number | { length: number; width: number; height?: number } | undefined
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
  // Step management
  const [currentStep, setCurrentStep] = useState(1);

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
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const error = validateContactDetails(contactDetails);
      if (error) {
        setValidationError(error);
        return;
      }
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

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2 bg-accent-dark text-accent-light hover:bg-accent-dark/90"
          >
            Volgende
            <ArrowRightIcon className="size-4" />
          </Button>
        ) : (
          // Placeholder for Phase 3 - submit button
          <Button
            type="button"
            disabled
            className="flex items-center gap-2 bg-accent-dark text-accent-light hover:bg-accent-dark/90"
          >
            Offerte aanvragen
            <ArrowRightIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
