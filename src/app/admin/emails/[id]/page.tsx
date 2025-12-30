"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  CheckIcon,
  EllipsisIcon,
  ForwardIcon,
  Loader2Icon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { getTestEmail } from "@/lib/adminSettings";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/admin/media/ImageUpload";
import type { Newsletter, NewsletterSection } from "@/config/newsletter";

export default function EditNewsletterPage() {
  const params = useParams();
  const router = useRouter();

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [savedNewsletter, setSavedNewsletter] = useState<Newsletter | null>(
    null,
  );
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Action states
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dialog states
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testEmail, setTestEmailState] = useState<string>("");

  const hasChanges =
    newsletter &&
    savedNewsletter &&
    JSON.stringify(newsletter) !== JSON.stringify(savedNewsletter);

  const isDraft = newsletter?.status === "draft";

  useEffect(() => {
    loadNewsletter();
    loadSubscriberCount();
    setTestEmailState(getTestEmail());
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
      setSavedNewsletter(data.newsletter);
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

  const updateField = <K extends keyof Newsletter>(
    field: K,
    value: Newsletter[K],
  ) => {
    setNewsletter((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateSection = (
    index: number,
    field: keyof NewsletterSection,
    value: string,
  ) => {
    setNewsletter((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section, i) =>
              i === index ? { ...section, [field]: value } : section,
            ),
          }
        : prev,
    );
  };

  const addSection = () => {
    setNewsletter((prev) =>
      prev
        ? {
            ...prev,
            sections: [
              ...prev.sections,
              { id: crypto.randomUUID(), title: "", text: "" },
            ],
          }
        : prev,
    );
  };

  const handleRemoveSectionClick = (index: number) => {
    if (newsletter && newsletter.sections.length <= 1) {
      toast.error("Je hebt minimaal één sectie nodig");
      return;
    }
    setSectionToDelete(index);
  };

  const handleRemoveSectionConfirm = () => {
    if (sectionToDelete !== null) {
      setNewsletter((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.filter((_, i) => i !== sectionToDelete),
            }
          : prev,
      );
    }
    setSectionToDelete(null);
  };

  const handleSave = useCallback(async () => {
    if (!newsletter) return;

    setSaving(true);
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

      setSavedNewsletter(newsletter);
      toast.success("Concept opgeslagen");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Kon concept niet opslaan");
    } finally {
      setSaving(false);
    }
  }, [newsletter]);

  const handleSendTestClick = () => {
    if (!newsletter) return;

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
    if (!newsletter) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error("Vul een geldig e-mailadres in");
      return;
    }

    setShowTestDialog(false);
    setSendingTest(true);

    try {
      // First save the newsletter
      await handleSave();

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

  const handleSendBroadcastClick = () => {
    if (!newsletter) return;

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
    if (!newsletter) return;

    setShowBroadcastConfirm(false);
    setSendingBroadcast(true);

    try {
      // First save the newsletter
      await handleSave();

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
      router.push("/admin/emails");
    } catch (error) {
      console.error("Failed to send broadcast:", error);
      toast.error(error instanceof Error ? error.message : "Verzenden mislukt");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDelete = async () => {
    if (!newsletter) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/newsletters/${newsletter.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete newsletter");
      }

      toast.success("Nieuwsbrief verwijderd");
      router.push("/admin/emails");
    } catch (error) {
      console.error("Failed to delete newsletter:", error);
      toast.error("Kon nieuwsbrief niet verwijderen");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saving || sendingBroadcast}
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckIcon className="size-4" />
          )}
          Opslaan
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm">
              <EllipsisIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleSendTestClick}
              disabled={sendingTest || saving || sendingBroadcast}
            >
              <ForwardIcon className="size-4" />
              Test versturen
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSendBroadcastClick}
              disabled={
                sendingBroadcast ||
                saving ||
                sendingTest ||
                !subscriberCount ||
                subscriberCount === 0
              }
            >
              <SendIcon className="size-4" />
              {subscriberCount && subscriberCount > 0
                ? `Versturen (${subscriberCount})`
                : "Versturen"}
            </DropdownMenuItem>
            {isDraft && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2Icon className="size-4" />
                  Verwijderen
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    ),
    [
      saving,
      hasChanges,
      sendingTest,
      sendingBroadcast,
      subscriberCount,
      isDraft,
      handleSave,
    ],
  );
  useAdminHeaderActions(headerActions);

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
    <FieldGroup className="max-w-2xl">
      {/* Subject & Preheader */}
      <FieldSet>
        <Field>
          <FieldLabel htmlFor="subject">Onderwerp</FieldLabel>
          <Input
            id="subject"
            placeholder="bijv. Winterkorting op alle tuinhuizen"
            value={newsletter.subject}
            onChange={(e) => updateField("subject", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="preheader">Preheader</FieldLabel>
          <Input
            id="preheader"
            placeholder="Korte preview tekst die in de inbox wordt getoond"
            value={newsletter.preheader || ""}
            onChange={(e) => updateField("preheader", e.target.value || null)}
          />
          <FieldDescription>
            Optionele tekst die naast het onderwerp in de inbox verschijnt
          </FieldDescription>
        </Field>
      </FieldSet>

      <Separator />

      {/* Sections */}
      <FieldSet>
        <header className="flex items-center justify-between">
          <h3 className="mb-0! text-sm font-medium">Secties</h3>
          <Button size="sm" variant="outline" onClick={addSection}>
            <PlusIcon className="size-4" />
            Sectie toevoegen
          </Button>
        </header>

        <div className="space-y-6">
          {newsletter.sections.map((section, index) => {
            const hasAction = !!(section.ctaText || section.ctaUrl);

            return (
              <div key={section.id} className="p-4 rounded-lg border">
                <FieldSet>
                  {/*<span className="text-sm font-medium">
                    Sectie {index + 1}
                  </span>*/}

                  <Field>
                    <FieldLabel>Afbeelding</FieldLabel>
                    <ImageUpload
                      value={
                        section.imageUrl ? { url: section.imageUrl } : null
                      }
                      onChange={(val) =>
                        updateSection(index, "imageUrl", val?.url || "")
                      }
                    />
                    <FieldDescription>Optioneel</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`title-${index}`}>Titel</FieldLabel>
                    <Input
                      id={`title-${index}`}
                      placeholder="Sectie titel"
                      value={section.title}
                      onChange={(e) =>
                        updateSection(index, "title", e.target.value)
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Tekst</FieldLabel>
                    <RichTextEditor
                      value={section.text}
                      onChange={(val) => updateSection(index, "text", val)}
                    />
                  </Field>

                  <Separator />

                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={`cta-toggle-${index}`}>
                      Actie
                    </FieldLabel>
                    <Switch
                      id={`cta-toggle-${index}`}
                      checked={hasAction}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateSection(index, "ctaText", "Meer info");
                        } else {
                          updateSection(index, "ctaText", "");
                          updateSection(index, "ctaUrl", "");
                        }
                      }}
                    />
                  </Field>

                  {hasAction && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor={`cta-text-${index}`}>
                          Label
                        </FieldLabel>
                        <Input
                          id={`cta-text-${index}`}
                          placeholder="bijv. Bekijk meer"
                          value={section.ctaText || ""}
                          onChange={(e) =>
                            updateSection(index, "ctaText", e.target.value)
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`cta-url-${index}`}>
                          URL
                        </FieldLabel>
                        <Input
                          id={`cta-url-${index}`}
                          placeholder="https://..."
                          value={section.ctaUrl || ""}
                          onChange={(e) =>
                            updateSection(index, "ctaUrl", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  )}

                  <Separator />

                  <Button
                    className="w-fit text-destructive"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemoveSectionClick(index)}
                    disabled={newsletter.sections.length <= 1}
                  >
                    <Trash2Icon className="size-4" />
                    Sectie verwijderen
                  </Button>
                </FieldSet>
              </div>
            );
          })}
        </div>
      </FieldSet>

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSectionToDelete(null)}
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemoveSectionConfirm}
            >
              <Trash2Icon className="size-4" />
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Confirmation Dialog */}
      <Dialog
        open={showBroadcastConfirm}
        onOpenChange={setShowBroadcastConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwsbrief versturen</DialogTitle>
            <DialogDescription>
              Je staat op het punt om deze nieuwsbrief te versturen naar{" "}
              <strong>
                {subscriberCount}{" "}
                {subscriberCount === 1 ? "abonnee" : "abonnees"}
              </strong>
              . Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBroadcastConfirm(false)}
            >
              Annuleren
            </Button>
            <Button size="sm" onClick={handleConfirmBroadcast}>
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
            <Field>
              <FieldLabel htmlFor="test-email">E-mailadres</FieldLabel>
              <Input
                id="test-email"
                type="email"
                placeholder="test@voorbeeld.be"
                value={testEmail}
                onChange={(e) => setTestEmailState(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTestDialog(false)}
            >
              Annuleren
            </Button>
            <Button size="sm" onClick={handleConfirmTest}>
              <ForwardIcon className="size-4" />
              Versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Newsletter Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwsbrief verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze nieuwsbrief wilt verwijderen? Deze actie
              kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FieldGroup>
  );
}
