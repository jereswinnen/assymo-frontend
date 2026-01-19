"use client";

import { useState, useEffect, use, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2Icon, SaveIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { t } from "@/config/strings";

interface ImageData {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  altText: string | null;
  displayName: string | null;
  folderId: string | null;
  siteId: string | null;
}

export default function ImageDetailPage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url: urlParam } = use(params);
  // Decode the URL param for display and API operations
  const imageUrl = decodeURIComponent(urlParam);
  const router = useRouter();
  const { authorized, loading: permissionLoading } = useRequireFeature("media");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<ImageData | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [altText, setAltText] = useState("");

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alt text generation
  const [generating, setGenerating] = useState(false);

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  // Sibling navigation
  const [siblingUrls, setSiblingUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchImage();
  }, [imageUrl]);

  useEffect(() => {
    if (!image) return;

    const originalDisplayName = image.displayName || image.pathname;
    const originalAltText = image.altText || "";

    const changed =
      displayName !== originalDisplayName || altText !== originalAltText;

    setHasChanges(changed);
  }, [displayName, altText, image]);

  // Keyboard navigation between images
  useEffect(() => {
    if (siblingUrls.length <= 1) return;

    const currentIndex = siblingUrls.indexOf(imageUrl);
    if (currentIndex === -1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        router.push(
          `/admin/content/media/${encodeURIComponent(siblingUrls[currentIndex - 1])}`,
        );
      } else if (
        e.key === "ArrowRight" &&
        currentIndex < siblingUrls.length - 1
      ) {
        router.push(
          `/admin/content/media/${encodeURIComponent(siblingUrls[currentIndex + 1])}`,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [siblingUrls, imageUrl, router]);

  const fetchImage = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/content/media/${encodeURIComponent(imageUrl)}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error(t("admin.messages.imageNotFound"));
          router.push("/admin/content/media");
          return;
        }
        throw new Error("Failed to fetch image");
      }

      const data: ImageData = await response.json();
      setImage(data);
      setDisplayName(data.displayName || data.pathname);
      setAltText(data.altText || "");

      // Fetch sibling images for keyboard navigation
      const folderParam = data.folderId || "root";
      const siblingsRes = await fetch(
        `/api/admin/content/media?folderId=${folderParam}${data.siteId ? `&siteId=${data.siteId}` : ""}`,
      );
      if (siblingsRes.ok) {
        const siblings = await siblingsRes.json();
        setSiblingUrls(siblings.map((s: { url: string }) => s.url));
      }
    } catch {
      toast.error(t("admin.messages.imageLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const saveImage = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/content/media/${encodeURIComponent(imageUrl)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName,
            altText,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const updated: ImageData = await response.json();
      setImage(updated);
      setHasChanges(false);
      toast.success(t("admin.messages.imageSaved"));
    } catch {
      toast.error(t("admin.messages.imageSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [imageUrl, displayName, altText]);

  const deleteImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      // POST with URL in body (like thumbnail delete) to avoid encoding issues
      const response = await fetch("/api/admin/content/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });

      const data = await response.json();

      // Close dialog first
      setDeleting(false);
      setShowDeleteDialog(false);

      if (!response.ok) {
        toast.error(data.error || t("admin.messages.imageDeleteFailed"));
        return;
      }

      toast.success(t("admin.messages.imageDeleted"));
      router.push("/admin/content/media");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleting(false);
      setShowDeleteDialog(false);
      toast.error(t("admin.messages.imageDeleteFailed"));
    }
  };

  const generateAltText = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/content/media/generate-alt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const { altText: newAltText } = await response.json();
      setAltText(newAltText);

      // Update image state so hasChanges reflects the new value
      if (image) {
        setImage({ ...image, altText: newAltText });
      }

      toast.success(t("admin.messages.altGenerated"));
    } catch {
      toast.error(t("admin.messages.altGenerateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2Icon className="size-4" />
          {t("admin.buttons.delete")}
        </Button>
        <Button size="sm" onClick={saveImage} disabled={saving || !hasChanges}>
          {saving ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t("admin.loading.saving")}
            </>
          ) : (
            <>
              <SaveIcon className="size-4" />
              {t("admin.buttons.save")}
            </>
          )}
        </Button>
      </>
    ),
    [saving, hasChanges, saveImage],
  );
  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!image) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
        {/* Image preview */}
        <div className="md:col-span-2 min-h-0">
          <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={image.url}
              alt={altText || image.pathname}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-muted rounded-lg p-4">
          <FieldGroup>
            {/* Details */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="displayName">
                  {t("admin.labels.filename")}
                </FieldLabel>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("admin.placeholders.filename")}
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="altText">
                    {t("admin.labels.altText")}
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAltText}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2Icon className="size-3 animate-spin" />
                        {t("admin.loading.generating")}
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="size-3" />
                        {t("admin.misc.generateWithAI")}
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder={t("admin.placeholders.altDescription")}
                  rows={4}
                />
                <FieldDescription>
                  {t("admin.misc.accessibilityDesc")}
                </FieldDescription>
              </Field>
            </FieldSet>

            <FieldSeparator />

            {/* Meta info */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.misc.fileSize")}
                </span>
                <span>{formatFileSize(image.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("admin.misc.uploadedOn")}
                </span>
                <span>
                  {new Date(image.uploadedAt).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </FieldGroup>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.misc.deleteImageQuestion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteImageDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteImage}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.deleting")}
                </>
              ) : (
                t("admin.buttons.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
