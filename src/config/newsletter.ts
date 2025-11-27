// ============================================================================
// NEWSLETTER TYPES
// Used by the email template, admin composer, and API routes
// ============================================================================

export interface NewsletterSection {
  id: string;
  imageUrl?: string;
  title: string;
  text: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface Newsletter {
  id: number;
  subject: string;
  preheader: string | null;
  sections: NewsletterSection[];
  status: "draft" | "sent";
  subscriberCount: number | null;
  resendEmailId: string | null;
  createdAt: Date;
  sentAt: Date | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create a new empty section with a unique ID
 */
export function createEmptySection(): NewsletterSection {
  return {
    id: crypto.randomUUID(),
    title: "",
    text: "",
  };
}

/**
 * Create a new empty newsletter draft
 */
export function createEmptyNewsletter(): Omit<Newsletter, "id" | "createdAt"> {
  return {
    subject: "",
    preheader: null,
    sections: [createEmptySection()],
    status: "draft",
    subscriberCount: null,
    resendEmailId: null,
    sentAt: null,
  };
}
