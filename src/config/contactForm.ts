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

export type Subject = "Algemeen" | "Offerte aanvragen";

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
  placeholder?: string;
  /** If true, options will be provided dynamically (e.g., from database) */
  dynamicOptions?: boolean;
  /** Products that should show this field (matched by name) */
  showForProducts?: string[];
}

// Products that should show the Budget field
export const PRODUCTS_WITH_BUDGET = [
  "Tuinhuizen op maat",
  "Poorten",
  "Overdekkingen",
  "Carports",
];

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
    label: "Telefoonnummer",
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
      { value: "Offerte aanvragen", label: "Offerte aanvragen" },
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

  // Offerte aanvragen fields
  {
    name: "product",
    label: "Product",
    type: "select",
    required: true,
    subject: "Offerte aanvragen",
    dynamicOptions: true, // Options provided from solutions
  },
  {
    name: "budget",
    label: "Budget",
    type: "text",
    required: false,
    subject: "Offerte aanvragen",
    showForProducts: PRODUCTS_WITH_BUDGET,
  },
  {
    name: "bestand",
    label: "Bestand uploaden",
    type: "file",
    accept: "image/*,application/pdf,.doc,.docx",
    subject: "Offerte aanvragen",
  },
  {
    name: "extraInfo",
    label: "Extra informatie",
    type: "textarea",
    required: false,
    subject: "Offerte aanvragen",
    placeholder: "Eventuele extra informatie over je project...",
  },

  // Newsletter opt-in (all subjects)
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
 * Get fields visible for a given subject and product
 * Filters out fields that have showForProducts but the current product isn't in the list
 */
export function getVisibleFieldsForProduct(
  subject: Subject,
  product: string | null
): FieldConfig[] {
  return getVisibleFields(subject).filter((field) => {
    // If field has showForProducts, check if current product matches
    if (field.showForProducts && field.showForProducts.length > 0) {
      if (!product) return false;
      return field.showForProducts.some(
        (p) => p.toLowerCase() === product.toLowerCase()
      );
    }
    return true;
  });
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
