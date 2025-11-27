"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  CheckIcon,
  ForwardIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Newsletter, NewsletterSection } from "@/config/newsletter";

interface NewsletterComposerProps {
  newsletter: Newsletter;
  onSave: (newsletter: Newsletter) => Promise<void>;
  onClose: () => void;
}

export function NewsletterComposer({
  newsletter: initialNewsletter,
  onSave,
  onClose,
}: NewsletterComposerProps) {
  const [newsletter, setNewsletter] = useState<Newsletter>(initialNewsletter);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);

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
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!newsletter.subject.trim()) {
      toast.error("Vul een onderwerp in");
      return;
    }

    if (newsletter.sections.every((s) => !s.title.trim() && !s.text.trim())) {
      toast.error("Voeg content toe aan minimaal één sectie");
      return;
    }

    setSendingTest(true);
    try {
      // First save the newsletter
      await onSave(newsletter);

      const response = await fetch(
        `/api/admin/newsletters/${newsletter.id}/test`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Test verzenden mislukt");
      }

      toast.success("Test e-mail verzonden naar je inbox");
    } catch (error) {
      console.error("Failed to send test:", error);
      toast.error(
        error instanceof Error ? error.message : "Test verzenden mislukt",
      );
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Nieuwsbrief bewerken</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XIcon className="size-4" />
        </Button>
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

      <Separator />

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

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckIcon className="size-4" />
          )}
          Bewaren
        </Button>

        <Button
          variant="outline"
          onClick={handleSendTest}
          disabled={sendingTest || saving}
        >
          {sendingTest ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ForwardIcon className="size-4" />
          )}
          Test versturen
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
    </div>
  );
}
