"use client";

import { useState, useEffect, use, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUpload, ImageValue } from "@/components/admin/ImageUpload";
import { SectionList } from "@/components/admin/SectionList";
import { AddSectionButton } from "@/components/admin/AddSectionButton";
import { Section } from "@/types/sections";
import { toast } from "sonner";
import {
  CheckIcon,
  CompassIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";

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

  const savePage = useCallback(async () => {
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
        error instanceof Error ? error.message : "Kon pagina niet opslaan",
      );
    } finally {
      setSaving(false);
    }
  }, [id, title, slug, isHomepage, headerImage, sections]);

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

  // Header actions
  const headerActions = useMemo(
    () => (
      <>
        <Button size="sm" onClick={savePage} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckIcon className="size-4" />
          )}
          Opslaan
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href={isHomepage ? "/" : `/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CompassIcon className="size-4" />
                Open in browser
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isHomepage}
            >
              <Trash2Icon className="size-4" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    ),
    [isHomepage, slug, saving, hasChanges, savePage],
  );
  useAdminHeaderActions(headerActions);

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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Main content - Sections */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Secties</h3>
            <AddSectionButton
              onAdd={(section) => setSections([...sections, section])}
            />
          </div>
          <SectionList
            sections={sections}
            onChange={setSections}
            showAddButton={false}
          />
        </div>

        {/* Sidebar */}
        <div className="bg-muted rounded-lg p-4 space-y-4">
          {/* Algemeen */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Algemeen</h3>
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
          </div>

          <Separator />

          {/* Header image */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Header afbeelding</h3>
            <ImageUpload value={headerImage} onChange={setHeaderImage} />
          </div>

          <Separator />

          {/* Meta info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Informatie</h3>
            <div className="space-y-3 text-sm">
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
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagina verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{page.title}&quot; wilt verwijderen?
              Dit kan niet ongedaan worden gemaakt.
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
