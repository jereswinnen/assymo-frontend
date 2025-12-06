import { resend } from "@/lib/resend";
import { RESEND_CONFIG } from "@/config/resend";

export async function unsubscribeContact(
  contactId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_CONFIG.audienceId) {
    console.error("RESEND_AUDIENCE_ID is not configured");
    return { success: false, error: "Configuratiefout" };
  }

  try {
    // Update contact to unsubscribed by ID
    const { error } = await resend.contacts.update({
      audienceId: RESEND_CONFIG.audienceId,
      id: contactId,
      unsubscribed: true,
    });

    if (error) {
      console.error("Failed to unsubscribe contact:", error);
      return {
        success: false,
        error: "Kon niet uitschrijven. Probeer later opnieuw.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return { success: false, error: "Er is iets misgegaan." };
  }
}
