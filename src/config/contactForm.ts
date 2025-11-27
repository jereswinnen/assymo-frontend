// ============================================================================
// CONTACT FORM FIELD CONFIGURATION
// Used by both the ContactForm component (rendering) and API route (validation)
// ============================================================================

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "file"
  | "checkbox";

export type Subject = "Algemeen" | "Tuinhuizen";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  autoComplete?: string;
  accept?: string; // for file inputs
  options?: FieldOption[]; // for select inputs
  subject?: Subject; // if set, only show for this subject
}

export const FORM_FIELDS: FieldConfig[] = [
  // Common fields (shown for all subjects)
  {
    name: "name",
    label: "Naam",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "E-mailadres",
    type: "email",
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Telefoon",
    type: "tel",
    required: true,
    autoComplete: "tel",
  },
  {
    name: "address",
    label: "Adres",
    type: "text",
    required: true,
    autoComplete: "street-address",
  },
  {
    name: "subject",
    label: "Onderwerp",
    type: "select",
    options: [
      { value: "Algemeen", label: "Algemeen" },
      { value: "Tuinhuizen", label: "Tuinhuizen" },
    ],
  },

  // Algemeen fields
  {
    name: "message",
    label: "Bericht",
    type: "textarea",
    required: true,
    subject: "Algemeen",
  },

  // Tuinhuizen fields
  {
    name: "extraInfo",
    label: "Extra informatie",
    type: "textarea",
    required: true,
    subject: "Tuinhuizen",
  },
  {
    name: "grondplanFile",
    label: "Grondplan uploaden",
    type: "file",
    accept: "image/*,application/pdf",
    subject: "Tuinhuizen",
  },
  {
    name: "bouwType",
    label: "Bouwpakket of geplaatst",
    type: "select",
    options: [
      { value: "Bouwpakket", label: "Bouwpakket" },
      { value: "Geplaatst", label: "Geplaatst" },
    ],
    subject: "Tuinhuizen",
  },
  {
    name: "bekledingHoutsoort",
    label: "Bekledingen: houtsoort",
    type: "text",
    subject: "Tuinhuizen",
  },
  {
    name: "bekledingProfiel",
    label: "Bekledingen: profiel",
    type: "text",
    subject: "Tuinhuizen",
  },
  {
    name: "newsletterOptIn",
    label: "Ja, ik ontvang graag nieuws over aanbiedingen",
    type: "checkbox",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get fields visible for a given subject
 */
export function getVisibleFields(subject: Subject): FieldConfig[] {
  return FORM_FIELDS.filter(
    (field) => !field.subject || field.subject === subject
  );
}

/**
 * Get required fields for a given subject
 */
export function getRequiredFields(subject: Subject): FieldConfig[] {
  return getVisibleFields(subject).filter((field) => field.required);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate form data for a given subject
 * Returns null if valid, or an error message if invalid
 */
export function validateFormData(
  formData: FormData,
  subject: Subject
): string | null {
  const requiredFields = getRequiredFields(subject);

  for (const field of requiredFields) {
    const value = formData.get(field.name);

    if (field.type === "email") {
      const email = (value as string) || "";
      if (!isValidEmail(email)) {
        return "Ongeldig e-mailadres";
      }
    } else if (field.type === "file") {
      // Files are optional even if marked required (for now)
      continue;
    } else {
      const strValue = (value as string) || "";
      if (!strValue.trim()) {
        return `Vul ${field.label.toLowerCase()} in`;
      }
    }
  }

  return null;
}

/**
 * Generate initial form state from field config
 */
export type FormDataState = Record<string, string | boolean | File | null>;

export function getInitialFormData(): FormDataState {
  return FORM_FIELDS.reduce((acc, field) => {
    if (field.type === "checkbox") {
      acc[field.name] = false;
    } else if (field.type === "file") {
      acc[field.name] = null;
    } else if (field.type === "select" && field.options?.length) {
      acc[field.name] = field.options[0].value;
    } else {
      acc[field.name] = "";
    }
    return acc;
  }, {} as FormDataState);
}
