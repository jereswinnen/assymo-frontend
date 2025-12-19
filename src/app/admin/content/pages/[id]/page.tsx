"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { ImageUpload, ImageValue } from "@/components/admin/ImageUpload";
import { SectionList } from "@/components/admin/SectionList";
import { Section } from "@/types/sections";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PageData {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  header_image: ImageValue | null;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<PageData | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isHomepage, setIsHomepage] = useState(false);
  const [autoSlug, setAutoSlug] = useState(false);
  const [headerImage, setHeaderImage] = useState<ImageValue | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (!page) return;

    const changed =
      title !== page.title ||
      slug !== (page.slug || "") ||
      isHomepage !== page.is_homepage ||
      JSON.stringify(headerImage) !== JSON.stringify(page.header_image) ||
      JSON.stringify(sections) !== JSON.stringify(page.sections);

    setHasChanges(changed);
  }, [title, slug, isHomepage, headerImage, sections, page]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content/pages/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Pagina niet gevonden");
          router.push("/admin/content/pages");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data: PageData = await response.json();
      setPage(data);
      setTitle(data.title);
      setSlug(data.slug || "");
      setIsHomepage(data.is_homepage);
      setHeaderImage(data.header_image);
      setSections(data.sections || []);
    } catch {
      toast.error("Kon pagina niet ophalen");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setAutoSlug(false);
  };

  const savePage = async () => {
    if (!title.trim()) {
      toast.error("Titel is verplicht");
      return;
    }

    if (!isHomepage && !slug.trim()) {
      toast.error("Slug is verplicht voor niet-homepage pagina's");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: isHomepage ? null : slug.trim(),
          is_homepage: isHomepage,
          header_image: headerImage,
          sections,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const updatedPage = await response.json();
      setPage(updatedPage);
      setSlug(updatedPage.slug || "");
      setIsHomepage(updatedPage.is_homepage);
      setSections(updatedPage.sections || []);
      setHasChanges(false);
      toast.success("Pagina opgeslagen");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon pagina niet opslaan"
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/content/pages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Pagina verwijderd");
      router.push("/admin/content/pages");
    } catch {
      toast.error("Kon pagina niet verwijderen");
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

  if (!page) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content/pages">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={isHomepage ? "/" : `/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="size-4" />
              Bekijken
            </a>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isHomepage}
            title={isHomepage ? "Homepage kan niet verwijderd worden" : undefined}
          >
            <Trash2Icon className="size-4" />
            Verwijderen
          </Button>
          <Button
            onClick={savePage}
            disabled={saving || !hasChanges}
          >
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic fields */}
          <Card>
            <CardHeader>
              <CardTitle>Algemeen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_homepage">Homepage</Label>
                  <p className="text-xs text-muted-foreground">
                    Dit is de hoofdpagina van de website
                  </p>
                </div>
                <Switch
                  id="is_homepage"
                  checked={isHomepage}
                  onCheckedChange={setIsHomepage}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Pagina titel"
                />
              </div>
              {!isHomepage && (
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="pagina-slug"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /{slug || "..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Secties</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionList sections={sections} onChange={setSections} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Header image */}
          <Card>
            <CardHeader>
              <CardTitle>Header afbeelding</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload value={headerImage} onChange={setHeaderImage} />
            </CardContent>
          </Card>

          {/* Meta info */}
          <Card>
            <CardHeader>
              <CardTitle>Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aangemaakt</span>
                <span>
                  {new Date(page.created_at).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Laatst bewerkt</span>
                <span>
                  {new Date(page.updated_at).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
            <AlertDialogTitle>Pagina verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{page.title}&quot; wilt verwijderen? Dit
              kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePage}
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
