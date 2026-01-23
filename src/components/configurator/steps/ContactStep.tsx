"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import type { ContactDetails } from "../Wizard";

interface ContactStepProps {
  contactDetails: ContactDetails;
  onChange: (details: ContactDetails) => void;
  className?: string;
}

export function ContactStep({
  contactDetails,
  onChange,
  className,
}: ContactStepProps) {
  const updateField = <K extends keyof ContactDetails>(
    field: K,
    value: ContactDetails[K]
  ) => {
    onChange({ ...contactDetails, [field]: value });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-stone-600 mb-4">
        Vul uw gegevens in zodat we contact met u kunnen opnemen voor uw offerte.
      </p>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contact-name">Naam *</FieldLabel>
          <Input
            id="contact-name"
            type="text"
            required
            value={contactDetails.name}
            onChange={(e) => updateField("name", e.target.value)}
            autoComplete="name"
            placeholder="Uw volledige naam"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-email">E-mailadres *</FieldLabel>
          <Input
            id="contact-email"
            type="email"
            required
            value={contactDetails.email}
            onChange={(e) => updateField("email", e.target.value)}
            autoComplete="email"
            placeholder="uw@email.be"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-phone">Telefoonnummer *</FieldLabel>
          <Input
            id="contact-phone"
            type="tel"
            required
            value={contactDetails.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            autoComplete="tel"
            placeholder="+32 xxx xx xx xx"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-address">Adres *</FieldLabel>
          <Input
            id="contact-address"
            type="text"
            required
            value={contactDetails.address}
            onChange={(e) => updateField("address", e.target.value)}
            autoComplete="street-address"
            placeholder="Straat nr, postcode gemeente"
          />
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="contact-newsletter"
            checked={contactDetails.newsletterOptIn}
            onCheckedChange={(checked) =>
              updateField("newsletterOptIn", checked === true)
            }
          />
          <FieldLabel htmlFor="contact-newsletter" className="font-normal">
            Ja, ik ontvang graag nieuws over aanbiedingen
          </FieldLabel>
        </Field>
      </FieldGroup>
    </div>
  );
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateContactDetails(details: ContactDetails): string | null {
  if (!details.name.trim()) {
    return "Vul uw naam in";
  }
  if (!details.email.trim()) {
    return "Vul uw e-mailadres in";
  }
  if (!isValidEmail(details.email)) {
    return "Vul een geldig e-mailadres in";
  }
  if (!details.phone.trim()) {
    return "Vul uw telefoonnummer in";
  }
  if (!details.address.trim()) {
    return "Vul uw adres in";
  }
  return null;
}
