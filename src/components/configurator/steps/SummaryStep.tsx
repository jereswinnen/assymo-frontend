"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WizardAnswers, ContactDetails } from "../Wizard";

interface ProductOption {
  slug: string;
  name: string;
}

interface SummaryStepProps {
  selectedProduct: string | null;
  products: ProductOption[];
  answers: WizardAnswers;
  contactDetails: ContactDetails;
  className?: string;
}

export function SummaryStep({
  selectedProduct,
  products,
  answers,
  contactDetails,
  className,
}: SummaryStepProps) {
  const productName = products.find((p) => p.slug === selectedProduct)?.name || selectedProduct;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <p className="text-stone-600">
        Controleer hieronder uw gegevens. In de volgende fase ontvangt u een
        prijsindicatie en kunt u de offerte versturen.
      </p>

      {/* Product Configuration Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Uw configuratie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-stone-500">Product</dt>
            <dd className="mt-1 text-sm text-stone-900">
              {productName || "Niet geselecteerd"}
            </dd>
          </div>

          {Object.entries(answers).length > 0 ? (
            <div className="border-t pt-4">
              <dt className="text-sm font-medium text-stone-500 mb-2">
                Keuzes
              </dt>
              <dl className="space-y-2">
                {Object.entries(answers).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-stone-600 capitalize">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-stone-900 font-medium">
                      {formatAnswerValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-stone-500 italic">
              Geen aanvullende keuzes gemaakt
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact Details Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Uw gegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <SummaryRow label="Naam" value={contactDetails.name} />
            <SummaryRow label="E-mail" value={contactDetails.email} />
            <SummaryRow label="Telefoon" value={contactDetails.phone} />
            <SummaryRow label="Adres" value={contactDetails.address} />
            <SummaryRow
              label="Nieuwsbrief"
              value={contactDetails.newsletterOptIn ? "Ja" : "Nee"}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Placeholder for price calculation - will be added in Phase 3 */}
      <Card className="bg-stone-50 border-dashed">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-stone-600">
            Prijsindicatie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500">
            De prijsberekening wordt geladen in de volgende fase...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-stone-600">{label}</dt>
      <dd className="text-stone-900 font-medium">{value || "-"}</dd>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatAnswerValue(
  value: string | string[] | number | { length: number; width: number; height?: number } | undefined
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }

  if (typeof value === "object" && "length" in value && "width" in value) {
    const dims = value as { length: number; width: number; height?: number };
    const parts = [`${dims.length}m x ${dims.width}m`];
    if (dims.height) {
      parts.push(`x ${dims.height}m`);
    }
    return parts.join(" ");
  }

  if (typeof value === "number") {
    return String(value);
  }

  return String(value);
}
