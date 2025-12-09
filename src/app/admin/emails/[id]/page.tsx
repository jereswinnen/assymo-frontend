"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { NewsletterComposer } from "@/components/admin/NewsletterComposer";
import type { Newsletter } from "@/config/newsletter";

export default function EditNewsletterPage() {
  const params = useParams();
  const router = useRouter();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewsletter();
    loadSubscriberCount();
  }, [params.id]);

  const loadNewsletter = async () => {
    try {
      const response = await fetch(`/api/admin/newsletters/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Nieuwsbrief niet gevonden");
          router.push("/admin/emails");
          return;
        }
        throw new Error("Failed to load newsletter");
      }
      const data = await response.json();
      setNewsletter(data.newsletter);
    } catch (error) {
      console.error("Failed to load newsletter:", error);
      toast.error("Kon nieuwsbrief niet laden");
      router.push("/admin/emails");
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriberCount = async () => {
    try {
      const response = await fetch("/api/admin/contacts");
      if (!response.ok) throw new Error("Failed to load subscriber count");
      const data = await response.json();
      setSubscriberCount(data.count);
    } catch (error) {
      console.error("Failed to load subscriber count:", error);
    }
  };

  const handleSave = async (updated: Newsletter) => {
    try {
      const response = await fetch(`/api/admin/newsletters/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: updated.subject,
          preheader: updated.preheader,
          sections: updated.sections,
        }),
      });

      if (!response.ok) throw new Error("Failed to save draft");

      setNewsletter(updated);
      toast.success("Concept opgeslagen");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Kon concept niet opslaan");
    }
  };

  const handleClose = () => {
    router.push("/admin/emails");
  };

  const handleBroadcastSent = () => {
    router.push("/admin/emails");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!newsletter) {
    return null;
  }

  return (
    <NewsletterComposer
      newsletter={newsletter}
      subscriberCount={subscriberCount}
      onSave={handleSave}
      onBack={handleClose}
      onBroadcastSent={handleBroadcastSent}
    />
  );
}
