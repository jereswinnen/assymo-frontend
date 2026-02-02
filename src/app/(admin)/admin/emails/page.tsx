"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLinkIcon,
  Loader2Icon,
  MailIcon,
  MailPlusIcon,
  SquareArrowOutUpRightIcon,
  TextSelectIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { EmailTemplatePreview } from "@/components/admin/EmailTemplatePreview";
import type { Newsletter } from "@/config/newsletter";
import { t } from "@/config/strings";

export default function EmailsPage() {
  const { authorized, loading: permissionLoading } = useRequireFeature("emails");
  const router = useRouter();
  const [drafts, setDrafts] = useState<Newsletter[]>([]);
  const [sentNewsletters, setSentNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] =
    useState<Newsletter | null>(null);

  useEffect(() => {
    loadDrafts();
    loadSentNewsletters();
  }, []);

  const loadDrafts = async () => {
    try {
      const response = await fetch("/api/admin/newsletters");
      if (!response.ok) throw new Error("Failed to load drafts");
      const data = await response.json();
      setDrafts(data.newsletters || []);
    } catch (error) {
      console.error("Failed to load drafts:", error);
      toast.error(t("admin.messages.draftsLoadFailed"));
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

  const handleCreateNew = useCallback(async () => {
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
      router.push(`/admin/emails/${data.newsletter.id}`);
      toast.success(t("admin.messages.draftCreated"));
    } catch (error) {
      console.error("Failed to create draft:", error);
      toast.error(t("admin.messages.draftCreateFailed"));
    } finally {
      setCreating(false);
    }
  }, [router]);

  // Header actions
  const headerActions = useMemo(
    () => (
      <>
        <Button size="sm" variant="outline" asChild>
          <a
            href="https://resend.com/audiences"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SquareArrowOutUpRightIcon className="size-4" />
            Resend
          </a>
        </Button>
        <Button size="sm" onClick={handleCreateNew} disabled={creating}>
          {creating ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <MailPlusIcon className="size-4" />
          )}
          {t("admin.misc.newNewsletter")}
        </Button>
      </>
    ),
    [creating, handleCreateNew],
  );
  useAdminHeaderActions(headerActions);

  const handleSelectNewsletter = (newsletter: Newsletter) => {
    if (newsletter.status === "draft") {
      router.push(`/admin/emails/${newsletter.id}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, newsletter: Newsletter) => {
    e.stopPropagation();
    setNewsletterToDelete(newsletter);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!newsletterToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/newsletters/${newsletterToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete draft");

      setDrafts((prev) => prev.filter((d) => d.id !== newsletterToDelete.id));
      toast.success(t("admin.messages.draftDeleted"));
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast.error(t("admin.messages.draftDeleteFailed"));
    } finally {
      setDeleteDialogOpen(false);
      setNewsletterToDelete(null);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  // Combine drafts and sent newsletters, sorted by date (newest first)
  const allNewsletters = [...drafts, ...sentNewsletters].sort((a, b) => {
    const dateA = new Date(a.sentAt || a.createdAt);
    const dateB = new Date(b.sentAt || b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  if (permissionLoading || !authorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="newsletter" className="space-y-4" id="email-tabs">
      <TabsList>
        <TabsTrigger value="newsletter">
          <MailIcon className="size-4" />
          {t("admin.misc.newsletters")}
        </TabsTrigger>
        <TabsTrigger value="templates">
          <TextSelectIcon className="size-4" />
          {t("admin.misc.templates")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="newsletter" className="space-y-6">
        {allNewsletters.length === 0 ? (
          <div className="text-muted-foreground text-center text-sm py-8">
            {t("admin.misc.noNewsletters")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.labels.subject")}</TableHead>
                <TableHead>{t("admin.labels.status")}</TableHead>
                <TableHead>{t("admin.labels.date")}</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allNewsletters.map((newsletter) => {
                const resendUrl = newsletter.resendEmailId
                  ? `https://resend.com/emails/${newsletter.resendEmailId}`
                  : null;

                return (
                  <TableRow
                    key={newsletter.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (newsletter.status === "draft") {
                        handleSelectNewsletter(newsletter);
                      } else if (resendUrl) {
                        window.open(resendUrl, "_blank");
                      }
                    }}
                  >
                    <TableCell>
                      {newsletter.subject || (
                        <span className="italic text-muted-foreground">
                          {t("admin.misc.noSubject")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          newsletter.status === "sent" ? "default" : "outline"
                        }
                      >
                        {newsletter.status === "sent" ? t("admin.misc.sent") : t("admin.misc.draft")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(newsletter.sentAt || newsletter.createdAt)}
                    </TableCell>
                    <TableCell>
                      {newsletter.status === "draft" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(e, newsletter)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : resendUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(resendUrl, "_blank");
                          }}
                        >
                          <ExternalLinkIcon className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.headings.deleteDraft")}</DialogTitle>
              <DialogDescription>
                {t("admin.misc.deleteDraftDesc")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                {t("admin.buttons.cancel")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                <Trash2Icon className="size-4" />
                {t("admin.buttons.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="templates">
        <EmailTemplatePreview />
      </TabsContent>
    </Tabs>
  );
}
