"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldDescription,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { CheckIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { t } from "@/config/strings";
import type { ConfiguratorCategory } from "@/lib/configurator/categories";

interface CategoryEditSheetProps {
  category: ConfiguratorCategory | null;
  siteId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (category: ConfiguratorCategory) => void;
  onDelete?: (categoryId: string) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryEditSheet({
  category,
  siteId,
  open,
  onOpenChange,
  onSaved,
  onDelete,
}: CategoryEditSheetProps) {
  const isNew = !category;

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    name: "",
    slug: "",
  });

  // Initialize form when sheet opens
  useEffect(() => {
    if (open && category) {
      setName(category.name);
      setSlug(category.slug);
      setOriginalValues({
        name: category.name,
        slug: category.slug,
      });
    } else if (open && !category) {
      setName("");
      setSlug("");
      setOriginalValues({
        name: "",
        slug: "",
      });
    }
  }, [open, category]);

  // Check for changes
  const hasChanges = useMemo(() => {
    if (isNew) {
      return name.trim().length > 0;
    }
    return name !== originalValues.name || slug !== originalValues.slug;
  }, [isNew, name, slug, originalValues]);

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error(t("admin.messages.nameSlugRequired"));
      return;
    }

    setSaving(true);
    try {
      const body = {
        siteId,
        name: name.trim(),
        slug: slug.trim(),
      };

      const url = category
        ? `/api/admin/configurator/categories/${category.id}`
        : "/api/admin/configurator/categories";
      const method = category ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const savedCategory = await response.json();
      toast.success(
        category
          ? t("admin.messages.itemUpdated")
          : t("admin.messages.itemCreated")
      );
      onOpenChange(false);
      onSaved(savedCategory);
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(t("admin.messages.itemSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/categories/${category.id}?siteId=${siteId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      toast.success(t("admin.messages.itemDeleted"));
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete?.(category.id);
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(t("admin.messages.itemDeleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="px-4 w-full md:max-w-md overflow-y-auto">
          <SheetHeader className="px-0">
            <SheetTitle>
              {category
                ? t("admin.headings.editItem")
                : t("admin.buttons.addItem")}
            </SheetTitle>
            <SheetDescription>
              {category
                ? t("admin.misc.editItemDesc")
                : t("admin.misc.addItemDesc")}
            </SheetDescription>
          </SheetHeader>

          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="category-name">{t("admin.labels.name")}</FieldLabel>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Auto-generate slug from name for new categories
                    if (!category) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                  placeholder="bijv. Poolhouses"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
                <Input
                  id="category-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="bijv. poolhouses"
                />
                <FieldDescription>
                  {t("admin.misc.slugHint")}
                </FieldDescription>
              </Field>
            </FieldSet>
          </FieldGroup>

          <SheetFooter className="px-0 flex-row justify-between">
            {category && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
                {t("admin.buttons.delete")}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !hasChanges} className="ml-auto">
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.saving")}
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  {category ? t("admin.buttons.save") : t("admin.buttons.create")}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.misc.deleteItemQuestion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteItemDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
    </>
  );
}
