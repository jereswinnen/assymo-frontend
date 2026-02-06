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
    value: ContactDetails[K],
  ) => {
    onChange({ ...contactDetails, [field]: value });
  };

  return (
    <div className={cn("flex flex-col gap-2 max-w-md", className)}>
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
          <FieldLabel htmlFor="contact-street">Straat en huisnummer *</FieldLabel>
          <Input
            id="contact-street"
            type="text"
            required
            value={contactDetails.street}
            onChange={(e) => updateField("street", e.target.value)}
            autoComplete="street-address"
            placeholder="Straat en huisnummer"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-postalCode">Postcode *</FieldLabel>
          <Input
            id="contact-postalCode"
            type="text"
            required
            value={contactDetails.postalCode}
            onChange={(e) => updateField("postalCode", e.target.value)}
            autoComplete="postal-code"
            placeholder="Postcode"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-city">Plaats *</FieldLabel>
          <Input
            id="contact-city"
            type="text"
            required
            value={contactDetails.city}
            onChange={(e) => updateField("city", e.target.value)}
            autoComplete="address-level2"
            placeholder="Plaats"
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
  if (!details.street.trim()) {
    return "Vul uw straat en huisnummer in";
  }
  if (!details.postalCode.trim()) {
    return "Vul uw postcode in";
  }
  if (!details.city.trim()) {
    return "Vul uw plaats in";
  }
  return null;
}
