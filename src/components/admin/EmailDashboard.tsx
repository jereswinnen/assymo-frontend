"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, MailPlusIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { NewsletterComposer } from "./NewsletterComposer";
import { DraftsList } from "./DraftsList";
import { BroadcastHistory } from "./BroadcastHistory";
import type { Newsletter } from "@/config/newsletter";

export function EmailDashboard() {
  const [drafts, setDrafts] = useState<Newsletter[]>([]);
  const [sentNewsletters, setSentNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Newsletter | null>(null);
  const [creating, setCreating] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  useEffect(() => {
    loadDrafts();
    loadSentNewsletters();
    loadSubscriberCount();
  }, []);

  const loadDrafts = async () => {
    try {
      const response = await fetch("/api/admin/newsletters");
      if (!response.ok) throw new Error("Failed to load drafts");
      const data = await response.json();
      setDrafts(data.newsletters || []);
    } catch (error) {
      console.error("Failed to load drafts:", error);
      toast.error("Kon concepten niet laden");
    } finally {
      setLoading(false);
    }
  };

  const loadSentNewsletters = async () => {
    try {
      const response = await fetch("/api/admin/newsletters?status=sent");
      if (!response.ok) throw new Error("Failed to load sent newsletters");
      const data = await response.json();
      setSentNewsletters(data.newsletters || []);
    } catch (error) {
      console.error("Failed to load sent newsletters:", error);
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

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "",
          preheader: "",
          sections: [{ id: crypto.randomUUID(), title: "", text: "" }],
        }),
      });

      if (!response.ok) throw new Error("Failed to create draft");

      const data = await response.json();
      setSelectedDraft(data.newsletter);
      await loadDrafts();
      toast.success("Nieuw concept aangemaakt");
    } catch (error) {
      console.error("Failed to create draft:", error);
      toast.error("Kon concept niet aanmaken");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectDraft = (draft: Newsletter) => {
    setSelectedDraft(draft);
  };

  const handleSave = async (newsletter: Newsletter) => {
    try {
      const response = await fetch(`/api/admin/newsletters/${newsletter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newsletter.subject,
          preheader: newsletter.preheader,
          sections: newsletter.sections,
        }),
      });

      if (!response.ok) throw new Error("Failed to save draft");

      await loadDrafts();
      toast.success("Concept opgeslagen");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Kon concept niet opslaan");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/newsletters/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete draft");

      if (selectedDraft?.id === id) {
        setSelectedDraft(null);
      }
      await loadDrafts();
      toast.success("Concept verwijderd");
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast.error("Kon concept niet verwijderen");
    }
  };

  const handleClose = () => {
    setSelectedDraft(null);
  };

  const handleBroadcastSent = async () => {
    setSelectedDraft(null);
    await loadDrafts();
    await loadSentNewsletters();
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardContent className="space-y-6">
        {/* Subscriber Count */}
        {subscriberCount !== null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="size-4" />
            <span>
              <strong className="text-foreground">{subscriberCount}</strong>{" "}
              {subscriberCount === 1 ? "abonnee" : "abonnees"}
            </span>
          </div>
        )}

        {/* Drafts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Concepten</h3>
              <p className="text-sm text-muted-foreground">
                Werk aan een nieuwsbrief of ga verder met een concept
              </p>
            </div>
            <Button onClick={handleCreateNew} disabled={creating}>
              {creating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <MailPlusIcon className="size-4" />
              )}
              Nieuwe nieuwsbrief
            </Button>
          </div>

          <DraftsList
            drafts={drafts}
            selectedId={selectedDraft?.id}
            onSelect={handleSelectDraft}
            onDelete={handleDelete}
          />
        </div>

        {selectedDraft && (
          <>
            <Separator />

            <NewsletterComposer
              newsletter={selectedDraft}
              subscriberCount={subscriberCount}
              onSave={handleSave}
              onClose={handleClose}
              onBroadcastSent={handleBroadcastSent}
            />
          </>
        )}

        {sentNewsletters.length > 0 && (
          <>
            <Separator />
            <BroadcastHistory newsletters={sentNewsletters} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
