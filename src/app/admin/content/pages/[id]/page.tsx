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
import { PasteSectionButton } from "@/components/admin/PasteSectionButton";
import { SeoPanel } from "@/components/admin/SeoPanel";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface PageData {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  header_image: ImageValue | null;
  sections: Section[];
  meta_title: string | null;
  meta_description: string | null;
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
  const { currentSite } = useSiteContext();

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
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [generatingMeta, setGeneratingMeta] = useState(false);

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
      JSON.stringify(sections) !== JSON.stringify(page.sections) ||
      metaTitle !== (page.meta_title || "") ||
      metaDescription !== (page.meta_description || "");

    setHasChanges(changed);
  }, [
    title,
    slug,
    isHomepage,
    headerImage,
    sections,
    metaTitle,
    metaDescription,
    page,
  ]);

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
      setMetaTitle(data.meta_title || "");
      setMetaDescription(data.meta_description || "");
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
          meta_title: metaTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
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
      setMetaTitle(updatedPage.meta_title || "");
      setMetaDescription(updatedPage.meta_description || "");
      setHasChanges(false);
      toast.success(t("admin.messages.pageSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.messages.pageSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }, [
    id,
    title,
    slug,
    isHomepage,
    headerImage,
    sections,
    metaTitle,
    metaDescription,
  ]);

  const generateMetaDescription = async () => {
    setGeneratingMeta(true);
    try {
      // Extract text content from sections for context
      const textContent = sections
        .map((section) => {
          const texts: string[] = [];
          const s = section as unknown as Record<string, unknown>;
          if (s.heading) texts.push(String(s.heading));
          if (s.text) texts.push(String(s.text));
          if (s.subtitle) texts.push(String(s.subtitle));
          return texts.join(" ");
        })
        .filter(Boolean)
        .join(" ")
        .slice(0, 1000);

      const response = await fetch(
        "/api/admin/content/generate-meta-description",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: textContent,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to generate");

      const { metaDescription: generated } = await response.json();
      setMetaDescription(generated);
      toast.success(t("admin.messages.metaDescriptionGenerated"));
    } catch {
      toast.error(t("admin.messages.metaDescriptionGenerateFailed"));
    } finally {
      setGeneratingMeta(false);
    }
  };

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
            <h3 className="mb-0! text-sm font-medium">
              {t("admin.misc.sections")}
            </h3>
            <div className="flex items-center gap-2">
              <AddSectionButton
                onAdd={(section) => setSections([...sections, section])}
              />
              <PasteSectionButton
                onPaste={(section) => setSections([...sections, section])}
              />
            </div>
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
        <div className="bg-muted sticky top-4 flex h-[calc(100vh-6rem)] flex-col rounded-lg p-4">
          <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="w-full shrink-0 bg-muted-foreground/10">
              <TabsTrigger value="general">
                {t("admin.headings.general")}
              </TabsTrigger>
              <TabsTrigger value="seo">{t("admin.headings.seo")}</TabsTrigger>
            </TabsList>

            <TabsContent
              value="general"
              className="mt-4 min-h-0 flex-1 overflow-y-auto"
            >
              <FieldGroup>
                <FieldSet>
                  <Field>
                    <FieldLabel htmlFor="title">
                      {t("admin.labels.title")}
                    </FieldLabel>
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
                        {currentSite?.domain || "https://..."}/{slug || "..."}
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
                    <span className="text-muted-foreground">
                      {t("admin.misc.created")}
                    </span>
                    <span>
                      {new Date(page.created_at).toLocaleDateString("nl-NL", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("admin.misc.lastEdited")}
                    </span>
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
            </TabsContent>

            <TabsContent
              value="seo"
              className="mt-4 min-h-0 flex-1 overflow-y-auto"
            >
              <SeoPanel
                title={title}
                slug={slug}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                onMetaTitleChange={setMetaTitle}
                onMetaDescriptionChange={setMetaDescription}
                onGenerateDescription={generateMetaDescription}
                generating={generatingMeta}
                domain={currentSite?.domain ?? undefined}
                basePath=""
                siteName="Assymo"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.misc.deletePageQuestion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deletePageDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
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
