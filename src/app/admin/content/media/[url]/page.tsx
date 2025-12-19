"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeftIcon,
  Loader2Icon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";

interface ImageData {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  altText: string | null;
  displayName: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageDetailPage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url: encodedUrl } = use(params);
  const imageUrl = decodeURIComponent(encodedUrl);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<ImageData | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [altText, setAltText] = useState("");

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

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

  const fetchImage = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/content/media/${encodeURIComponent(imageUrl)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Afbeelding niet gevonden");
          router.push("/admin/content/media");
          return;
        }
        throw new Error("Failed to fetch image");
      }

      const data: ImageData = await response.json();
      setImage(data);
      setDisplayName(data.displayName || data.pathname);
      setAltText(data.altText || "");
    } catch {
      toast.error("Kon afbeelding niet ophalen");
    } finally {
      setLoading(false);
    }
  };

  const saveImage = async () => {
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
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const updated: ImageData = await response.json();
      setImage(updated);
      setHasChanges(false);
      toast.success("Afbeelding opgeslagen");
    } catch {
      toast.error("Kon afbeelding niet opslaan");
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/media/${encodeURIComponent(imageUrl)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Afbeelding verwijderd");
      router.push("/admin/content/media");
    } catch {
      toast.error("Kon afbeelding niet verwijderen");
    } finally {
      setDeleting(false);
    }
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content/media">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2Icon className="size-4" />
            Verwijderen
          </Button>
          <Button onClick={saveImage} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Opslaan
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image preview */}
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={image.url}
                alt={altText || image.pathname}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </CardContent>
        </Card>

        {/* Details form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Bestandsnaam</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Bestandsnaam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">Alt tekst</Label>
                <Textarea
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Beschrijving van de afbeelding voor toegankelijkheid"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Alt tekst wordt gebruikt voor toegankelijkheid en SEO
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bestandsgrootte</span>
                <span>{formatFileSize(image.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Geupload op</span>
                <span>
                  {new Date(image.uploadedAt).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-muted-foreground text-xs break-all">
                  {image.url}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afbeelding verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze afbeelding wilt verwijderen? Dit kan niet
              ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteImage}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                "Verwijderen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
