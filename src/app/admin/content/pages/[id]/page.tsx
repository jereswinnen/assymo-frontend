"use client";

import { useState, useEffect, use, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUpload, ImageValue } from "@/components/admin/media/ImageUpload";
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
import { t } from "@/config/strings";

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
          toast.error(t("admin.messages.pageNotFound"));
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
      toast.error(t("admin.messages.pageLoadFailed"));
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
      toast.error(t("admin.messages.titleRequired"));
      return;
    }

    if (!isHomepage && !slug.trim()) {
      toast.error(t("admin.messages.slugRequired"));
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
      toast.success(t("admin.messages.pageSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.messages.pageSaveFailed"),
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

      toast.success(t("admin.messages.pageDeleted"));
      router.push("/admin/content/pages");
    } catch {
      toast.error(t("admin.messages.pageDeleteFailed"));
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
          {t("admin.buttons.save")}
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
              {t("admin.buttons.delete")}
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
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - Sections */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="mb-0! text-sm font-medium">{t("admin.misc.sections")}</h3>
            <AddSectionButton
              onAdd={(section) => setSections([...sections, section])}
            />
          </div>
          <SectionList
            sections={sections}
            onChange={setSections}
            onSave={savePage}
            saving={saving}
            hasChanges={hasChanges}
            showAddButton={false}
          />
        </div>

        {/* Sidebar */}
        <div className="bg-muted rounded-lg p-4">
          <FieldGroup>
            {/* Algemeen */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="title">{t("admin.labels.title")}</FieldLabel>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t("admin.placeholders.pageTitle")}
                />
              </Field>
              {!isHomepage && (
                <Field>
                  <FieldLabel htmlFor="slug">URL</FieldLabel>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  <FieldDescription>
                    {process.env.NEXT_PUBLIC_BASE_URL || "https://assymo.be"}/
                    {slug || "..."}
                  </FieldDescription>
                </Field>
              )}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="is_homepage">
                  {t("admin.misc.setAsHomepage")}
                </FieldLabel>
                <Switch
                  id="is_homepage"
                  checked={isHomepage}
                  onCheckedChange={setIsHomepage}
                />
              </Field>
            </FieldSet>

            <FieldSeparator />

            {/* Header image */}
            <Field>
              <FieldLabel>{t("admin.misc.headerImage")}</FieldLabel>
              <ImageUpload value={headerImage} onChange={setHeaderImage} />
            </Field>

            <FieldSeparator />

            {/* Meta info */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.misc.created")}</span>
                <span>
                  {new Date(page.created_at).toLocaleDateString("nl-NL", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("admin.misc.lastEdited")}</span>
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
          </FieldGroup>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.deletePageQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deletePageDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("admin.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePage}
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
