"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getTestEmail } from "@/lib/adminSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeftIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  CheckIcon,
  ForwardIcon,
  SendIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Newsletter, NewsletterSection } from "@/config/newsletter";

interface NewsletterComposerProps {
  newsletter: Newsletter;
  subscriberCount: number | null;
  onSave: (newsletter: Newsletter) => Promise<void>;
  onBack: () => void;
  onBroadcastSent: () => void;
}

export function NewsletterComposer({
  newsletter: initialNewsletter,
  subscriberCount,
  onSave,
  onBack,
  onBroadcastSent,
}: NewsletterComposerProps) {
  const [newsletter, setNewsletter] = useState<Newsletter>(initialNewsletter);
  const [savedNewsletter, setSavedNewsletter] =
    useState<Newsletter>(initialNewsletter);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmailState] = useState<string>("");

  // Track if there are unsaved changes
  const hasChanges =
    JSON.stringify(newsletter) !== JSON.stringify(savedNewsletter);

  // Load test email from centralized admin settings
  useEffect(() => {
    setTestEmailState(getTestEmail());
  }, []);

  const updateField = <K extends keyof Newsletter>(
    field: K,
    value: Newsletter[K],
  ) => {
    setNewsletter((prev) => ({ ...prev, [field]: value }));
  };

  const updateSection = (
    index: number,
    field: keyof NewsletterSection,
    value: string,
  ) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const addSection = () => {
    setNewsletter((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: crypto.randomUUID(), title: "", text: "" },
      ],
    }));
  };

  const handleRemoveSectionClick = (index: number) => {
    if (newsletter.sections.length <= 1) {
      toast.error("Je hebt minimaal één sectie nodig");
      return;
    }
    setSectionToDelete(index);
  };

  const handleRemoveSectionConfirm = () => {
    if (sectionToDelete !== null) {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== sectionToDelete),
      }));
    }
    setSectionToDelete(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(newsletter);
      setSavedNewsletter(newsletter);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestClick = () => {
    if (!newsletter.subject.trim()) {
      toast.error("Vul een onderwerp in");
      return;
    }

    if (newsletter.sections.every((s) => !s.title.trim() && !s.text.trim())) {
      toast.error("Voeg content toe aan minimaal één sectie");
      return;
    }

    setShowTestDialog(true);
  };

  const handleConfirmTest = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error("Vul een geldig e-mailadres in");
      return;
    }

    setShowTestDialog(false);
    setSendingTest(true);

    try {
      // First save the newsletter
      await onSave(newsletter);

      const response = await fetch(
        `/api/admin/newsletters/${newsletter.id}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testEmail }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Test verzenden mislukt");
      }

      toast.success(`Test e-mail verzonden naar ${testEmail}`);
    } catch (error) {
      console.error("Failed to send test:", error);
      toast.error(
        error instanceof Error ? error.message : "Test verzenden mislukt",
      );
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!newsletter.subject.trim()) {
      toast.error("Vul een onderwerp in");
      return;
    }

    if (newsletter.sections.every((s) => !s.title.trim() && !s.text.trim())) {
      toast.error("Voeg content toe aan minimaal één sectie");
      return;
    }

    if (!subscriberCount || subscriberCount === 0) {
      toast.error("Er zijn geen abonnees om naar te verzenden");
      return;
    }

    setShowBroadcastConfirm(true);
  };

  const handleConfirmBroadcast = async () => {
    setShowBroadcastConfirm(false);
    setSendingBroadcast(true);

    try {
      // First save the newsletter
      await onSave(newsletter);

      const response = await fetch(
        `/api/admin/newsletters/${newsletter.id}/send`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verzenden mislukt");
      }

      toast.success(
        `Nieuwsbrief verzonden naar ${data.sent} ${data.sent === 1 ? "abonnee" : "abonnees"}`,
      );
      onBroadcastSent();
    } catch (error) {
      console.error("Failed to send broadcast:", error);
      toast.error(
        error instanceof Error ? error.message : "Verzenden mislukt",
      );
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Terug
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving || sendingBroadcast}
          >
            {saving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            Bewaren
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestClick}
            disabled={sendingTest || saving || sendingBroadcast}
          >
            {sendingTest ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ForwardIcon className="size-4" />
            )}
            Test
          </Button>

          <Button
            size="sm"
            onClick={handleSendBroadcast}
            disabled={
              sendingBroadcast ||
              saving ||
              sendingTest ||
              !subscriberCount ||
              subscriberCount === 0
            }
          >
            {sendingBroadcast ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
            {subscriberCount && subscriberCount > 0
              ? `Verstuur (${subscriberCount})`
              : "Verstuur"}
          </Button>
        </div>
      </div>

      {/* Subject & Preheader */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Onderwerp</Label>
          <Input
            id="subject"
            placeholder="bijv. Winterkorting op alle tuinhuizen"
            value={newsletter.subject}
            onChange={(e) => updateField("subject", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preheader">
            Preheader{" "}
            <span className="text-muted-foreground font-normal">
              (optioneel)
            </span>
          </Label>
          <Input
            id="preheader"
            placeholder="Korte preview tekst die in de inbox wordt getoond"
            value={newsletter.preheader || ""}
            onChange={(e) => updateField("preheader", e.target.value || null)}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <Label>Secties</Label>

        {newsletter.sections.map((section, index) => (
          <div
            key={section.id}
            className="p-4 border rounded-lg space-y-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Sectie {index + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSectionClick(index)}
                disabled={newsletter.sections.length <= 1}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`image-${index}`}>
                Afbeelding URL{" "}
                <span className="text-muted-foreground font-normal">
                  (optioneel)
                </span>
              </Label>
              <Input
                id={`image-${index}`}
                placeholder="https://..."
                value={section.imageUrl || ""}
                onChange={(e) =>
                  updateSection(index, "imageUrl", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`title-${index}`}>Titel</Label>
              <Input
                id={`title-${index}`}
                placeholder="Sectie titel"
                value={section.title}
                onChange={(e) => updateSection(index, "title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`text-${index}`}>Tekst</Label>
              <Textarea
                id={`text-${index}`}
                placeholder="Sectie inhoud..."
                value={section.text}
                onChange={(e) => updateSection(index, "text", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`cta-text-${index}`}>
                  Knop tekst{" "}
                  <span className="text-muted-foreground font-normal">
                    (optioneel)
                  </span>
                </Label>
                <Input
                  id={`cta-text-${index}`}
                  placeholder="bijv. Bekijk meer"
                  value={section.ctaText || ""}
                  onChange={(e) =>
                    updateSection(index, "ctaText", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`cta-url-${index}`}>
                  Knop URL{" "}
                  <span className="text-muted-foreground font-normal">
                    (optioneel)
                  </span>
                </Label>
                <Input
                  id={`cta-url-${index}`}
                  placeholder="https://..."
                  value={section.ctaUrl || ""}
                  onChange={(e) =>
                    updateSection(index, "ctaUrl", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addSection} className="w-full">
          <PlusIcon className="size-4" />
          Sectie toevoegen
        </Button>
      </div>

      {/* Delete Section Dialog */}
      <Dialog
        open={sectionToDelete !== null}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sectie verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze sectie wilt verwijderen? Deze actie kan
              niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionToDelete(null)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleRemoveSectionConfirm}>
              <Trash2Icon className="size-4" />
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Confirmation Dialog */}
      <Dialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwsbrief versturen</DialogTitle>
            <DialogDescription>
              Je staat op het punt om deze nieuwsbrief te versturen naar{" "}
              <strong>
                {subscriberCount} {subscriberCount === 1 ? "abonnee" : "abonnees"}
              </strong>
              . Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBroadcastConfirm(false)}
            >
              Annuleren
            </Button>
            <Button onClick={handleConfirmBroadcast}>
              <SendIcon className="size-4" />
              Versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test e-mail versturen</DialogTitle>
            <DialogDescription>
              Verstuur een test e-mail om te controleren hoe de nieuwsbrief
              eruitziet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="test-email">E-mailadres</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@voorbeeld.be"
              value={testEmail}
              onChange={(e) => setTestEmailState(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handleConfirmTest}>
              <ForwardIcon className="size-4" />
              Versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
