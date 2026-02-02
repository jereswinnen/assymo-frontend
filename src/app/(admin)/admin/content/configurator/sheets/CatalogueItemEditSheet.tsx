"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { PriceCatalogueItem } from "@/lib/configurator/types";

const UNIT_OPTIONS = [
  { value: "_none", label: "Geen (vaste prijs)" },
  { value: "per stuk", label: "Per stuk" },
  { value: "per m²", label: "Per m²" },
  { value: "per m", label: "Per strekkende meter" },
  { value: "per uur", label: "Per uur" },
] as const;

interface CatalogueItemEditSheetProps {
  item: PriceCatalogueItem | null;
  siteId: string | undefined;
  existingCategories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: PriceCatalogueItem) => void;
  onDelete?: (itemId: string) => void;
}

export function CatalogueItemEditSheet({
  item,
  siteId,
  existingCategories,
  open,
  onOpenChange,
  onSaved,
  onDelete,
}: CatalogueItemEditSheetProps) {
  const isNew = !item;

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
  });

  // Initialize form when sheet opens
  useEffect(() => {
    if (open && item) {
      setName(item.name);
      setCategory(item.category);
      // Check if category is in existing categories
      setIsNewCategory(!existingCategories.includes(item.category));
      setPrice((item.price_min / 100).toString());
      setUnit(item.unit || "");
      setOriginalValues({
        name: item.name,
        category: item.category,
        price: (item.price_min / 100).toString(),
        unit: item.unit || "",
      });
    } else if (open && !item) {
      setName("");
      setCategory("");
      setIsNewCategory(false);
      setPrice("");
      setUnit("");
      setOriginalValues({
        name: "",
        category: "",
        price: "",
        unit: "",
      });
    }
  }, [open, item, existingCategories]);

  // Check for changes
  const hasChanges = useMemo(() => {
    if (isNew) {
      return name.trim().length > 0 && category.trim().length > 0;
    }
    return (
      name !== originalValues.name ||
      category !== originalValues.category ||
      price !== originalValues.price ||
      unit !== originalValues.unit
    );
  }, [isNew, name, category, price, unit, originalValues]);

  const handleSave = async () => {
    if (!name.trim() || !category.trim()) {
      toast.error(t("admin.messages.fillAllFields"));
      return;
    }

    const priceCents = Math.round(parseFloat(price || "0") * 100);

    if (priceCents <= 0) {
      toast.error("Vul een geldige prijs in");
      return;
    }

    setSaving(true);
    try {
      const body = {
        siteId,
        name: name.trim(),
        category: category.trim(),
        price_min: priceCents,
        price_max: priceCents, // Same as min - we use single price now
        unit: unit.trim() || null,
      };

      const url = item
        ? `/api/admin/configurator/catalogue/${item.id}`
        : "/api/admin/configurator/catalogue";
      const method = item ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const savedItem = await response.json();
      toast.success(
        item
          ? t("admin.messages.catalogueItemUpdated")
          : t("admin.messages.catalogueItemCreated")
      );
      onOpenChange(false);
      onSaved(savedItem);
    } catch (error) {
      console.error("Failed to save catalogue item:", error);
      toast.error(t("admin.messages.catalogueItemSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/catalogue/${item.id}?siteId=${siteId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      toast.success(t("admin.messages.catalogueItemDeleted"));
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete?.(item.id);
    } catch (error) {
      console.error("Failed to delete catalogue item:", error);
      toast.error(t("admin.messages.catalogueItemDeleteFailed"));
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
              {item
                ? t("admin.headings.editCatalogueItem")
                : t("admin.headings.newCatalogueItem")}
            </SheetTitle>
            <SheetDescription>
              {item
                ? t("admin.misc.editCatalogueItemDesc")
                : t("admin.misc.newCatalogueItemDesc")}
            </SheetDescription>
          </SheetHeader>

          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="item-name">{t("admin.labels.name")}</FieldLabel>
                <Input
                  id="item-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("admin.placeholders.catalogueItemName")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="item-category">{t("admin.labels.catalogueCategory")}</FieldLabel>
                {existingCategories.length > 0 && !isNewCategory ? (
                  <Select
                    value={category || "_select"}
                    onValueChange={(v) => {
                      if (v === "_new") {
                        setIsNewCategory(true);
                        setCategory("");
                      } else if (v !== "_select") {
                        setCategory(v);
                      }
                    }}
                  >
                    <SelectTrigger id="item-category">
                      <SelectValue placeholder="Selecteer categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="_new" className="text-muted-foreground">
                        + Nieuwe categorie...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="item-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder={t("admin.placeholders.catalogueCategory")}
                      autoFocus={isNewCategory}
                    />
                    {existingCategories.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setIsNewCategory(false);
                          setCategory("");
                        }}
                        title="Bestaande selecteren"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                )}
              </Field>
            </FieldSet>

            <FieldSet>
              <Field>
                <FieldLabel htmlFor="item-price">{t("admin.labels.startingPrice")} (EUR)</FieldLabel>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1000"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="item-unit">{t("admin.labels.unit")}</FieldLabel>
                <Select
                  value={unit || "_none"}
                  onValueChange={(v) => setUnit(v === "_none" ? "" : v)}
                >
                  <SelectTrigger id="item-unit">
                    <SelectValue placeholder="Selecteer eenheid" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Bepaalt hoe de prijs wordt berekend bij gebruik
                </FieldDescription>
              </Field>
            </FieldSet>
          </FieldGroup>

          <SheetFooter className="px-0 flex-row justify-between">
            {item && (
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
                  {item ? t("admin.buttons.save") : t("admin.buttons.create")}
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
              {t("admin.misc.deleteCatalogueItemQuestion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteCatalogueItemDesc")}
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
