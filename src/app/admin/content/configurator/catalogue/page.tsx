"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CoinsIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import { CatalogueItemEditSheet } from "./CatalogueItemEditSheet";
import type { PriceCatalogueItem } from "@/lib/configurator/types";

// Helper to format price in euros
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CataloguePage() {
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");
  const [items, setItems] = useState<PriceCatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingItem, setEditingItem] = useState<PriceCatalogueItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PriceCatalogueItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!siteLoading && currentSite) {
      loadData();
    }
  }, [currentSite, siteLoading]);

  const loadData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/configurator/catalogue?siteId=${currentSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch catalogue");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to load catalogue:", error);
      toast.error(t("admin.messages.catalogueLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget || !currentSite) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/catalogue/${deleteTarget.id}?siteId=${currentSite.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("admin.messages.catalogueItemDeleted"));
    } catch {
      toast.error(t("admin.messages.catalogueItemDeleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, PriceCatalogueItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [items]);

  const categories = Object.keys(groupedItems).sort();

  // Sheet handlers
  const openNewItemSheet = useCallback(() => {
    setEditingItem(null);
    setSheetOpen(true);
  }, []);

  const openEditItemSheet = (item: PriceCatalogueItem) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewItemSheet}>
        <PlusIcon className="size-4" />
        {t("admin.headings.newCatalogueItem")}
      </Button>
    ),
    [openNewItemSheet]
  );
  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  const isLoading = loading || siteLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CoinsIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t("admin.empty.noCatalogueItems")}</EmptyTitle>
            <EmptyDescription>{t("admin.empty.noCatalogueItemsDesc")}</EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={openNewItemSheet}>
            <PlusIcon className="size-4" />
            {t("admin.headings.newCatalogueItem")}
          </Button>
        </Empty>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">
                {category}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.labels.name")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("admin.labels.priceMin")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("admin.labels.priceMax")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("admin.labels.unit")}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedItems[category].map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer group"
                      onClick={() => openEditItemSheet(item)}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatPrice(item.price_min)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatPrice(item.price_max)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.unit ? (
                          <Badge variant="outline">{item.unit}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="w-10">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(item);
                          }}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Sheet */}
      <CatalogueItemEditSheet
        item={editingItem}
        siteId={currentSite?.id}
        existingCategories={categories}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSaved={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
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
              onClick={deleteItem}
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
