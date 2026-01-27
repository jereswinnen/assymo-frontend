"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CopyIcon,
  GripVerticalIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import { CategoryEditSheet } from "./sheets/CategoryEditSheet";
import { CatalogueItemEditSheet } from "./sheets/CatalogueItemEditSheet";
import type { ConfiguratorCategory } from "@/lib/configurator/categories";
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

export default function ConfiguratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");
  const initialTab = searchParams.get("tab") === "catalogue" ? "catalogue" : "categories";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Categories state
  const [categories, setCategories] = useState<ConfiguratorCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editingCategory, setEditingCategory] = useState<ConfiguratorCategory | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConfiguratorCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Catalogue state
  const [catalogueItems, setCatalogueItems] = useState<PriceCatalogueItem[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [editingCatalogueItem, setEditingCatalogueItem] = useState<PriceCatalogueItem | null>(null);
  const [catalogueSheetOpen, setCatalogueSheetOpen] = useState(false);
  const [deleteCatalogueTarget, setDeleteCatalogueTarget] = useState<PriceCatalogueItem | null>(null);
  const [deletingCatalogue, setDeletingCatalogue] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load categories
  useEffect(() => {
    if (!siteLoading && currentSite) {
      loadCategories();
      loadCatalogue();
    }
  }, [currentSite, siteLoading]);

  const loadCategories = async () => {
    if (!currentSite) return;
    setLoadingCategories(true);
    try {
      const response = await fetch(`/api/admin/configurator/categories?siteId=${currentSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load configurator data:", error);
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCatalogue = async () => {
    if (!currentSite) return;
    setLoadingCatalogue(true);
    try {
      const response = await fetch(`/api/admin/configurator/catalogue?siteId=${currentSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch catalogue");
      const data = await response.json();
      setCatalogueItems(data);
    } catch (error) {
      console.error("Failed to load catalogue:", error);
      toast.error(t("admin.messages.catalogueLoadFailed"));
    } finally {
      setLoadingCatalogue(false);
    }
  };

  // Category handlers
  const deleteCategory = async () => {
    if (!deleteTarget || !currentSite) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/categories/${deleteTarget.id}?siteId=${currentSite.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("admin.messages.itemDeleted"));
    } catch {
      toast.error(t("admin.messages.itemDeleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const duplicateCategory = async (category: ConfiguratorCategory) => {
    if (!currentSite) return;

    setDuplicating(category.id);
    try {
      const response = await fetch(
        `/api/admin/configurator/categories/${category.id}/duplicate?siteId=${currentSite.id}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate");
      }

      const newCategory = await response.json();
      setCategories((prev) => [...prev, newCategory]);
      toast.success(t("admin.messages.itemDuplicated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.messages.itemDuplicateFailed")
      );
    } finally {
      setDuplicating(null);
    }
  };

  const openNewCategorySheet = useCallback(() => {
    setEditingCategory(null);
    setCategorySheetOpen(true);
  }, []);

  const handleCategorySheetOpenChange = (open: boolean) => {
    setCategorySheetOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentSite) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      try {
        await fetch("/api/admin/configurator/categories/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newCategories.map((c) => c.id),
            siteId: currentSite.id,
          }),
        });
      } catch (error) {
        console.error("Failed to reorder categories:", error);
        toast.error(t("admin.messages.orderSaveFailed"));
        loadCategories();
      }
    }
  };

  // Catalogue handlers
  const deleteCatalogueItem = async () => {
    if (!deleteCatalogueTarget || !currentSite) return;

    setDeletingCatalogue(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/catalogue/${deleteCatalogueTarget.id}?siteId=${currentSite.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setCatalogueItems((prev) => prev.filter((item) => item.id !== deleteCatalogueTarget.id));
      setDeleteCatalogueTarget(null);
      toast.success(t("admin.messages.catalogueItemDeleted"));
    } catch {
      toast.error(t("admin.messages.catalogueItemDeleteFailed"));
    } finally {
      setDeletingCatalogue(false);
    }
  };

  const openNewCatalogueSheet = useCallback(() => {
    setEditingCatalogueItem(null);
    setCatalogueSheetOpen(true);
  }, []);

  const openEditCatalogueSheet = (item: PriceCatalogueItem) => {
    setEditingCatalogueItem(item);
    setCatalogueSheetOpen(true);
  };

  const handleCatalogueSheetOpenChange = (open: boolean) => {
    setCatalogueSheetOpen(open);
    if (!open) {
      setEditingCatalogueItem(null);
    }
  };

  // Group catalogue items by category
  const groupedCatalogueItems = useMemo(() => {
    const groups: Record<string, PriceCatalogueItem[]> = {};
    for (const item of catalogueItems) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [catalogueItems]);

  const catalogueCategories = Object.keys(groupedCatalogueItems).sort();

  // Header actions based on active tab
  const headerActions = useMemo(() => {
    if (activeTab === "categories") {
      return (
        <Button size="sm" onClick={openNewCategorySheet}>
          <PlusIcon className="size-4" />
          {t("admin.buttons.addItem")}
        </Button>
      );
    }

    if (activeTab === "catalogue") {
      return (
        <Button size="sm" onClick={openNewCatalogueSheet}>
          <PlusIcon className="size-4" />
          {t("admin.headings.newCatalogueItem")}
        </Button>
      );
    }

    return null;
  }, [activeTab, openNewCategorySheet, openNewCatalogueSheet]);

  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  const isLoading = loadingCategories || loadingCatalogue || siteLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="categories">
            <SettingsIcon className="size-4" />
            {t("admin.headings.categories")}
          </TabsTrigger>
          <TabsTrigger value="catalogue">
            <CoinsIcon className="size-4" />
            {t("admin.headings.priceCatalogue")}
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories">
          {categories.length === 0 ? (
            <Empty className="border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SettingsIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle>{t("admin.empty.noCategories")}</EmptyTitle>
                <EmptyDescription>{t("admin.empty.noCategoriesDesc")}</EmptyDescription>
              </EmptyHeader>
              <Button size="sm" onClick={openNewCategorySheet}>
                <PlusIcon className="size-4" />
                {t("admin.buttons.addItem")}
              </Button>
            </Empty>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>{t("admin.labels.name")}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <SortableCategoryRow
                        key={category.id}
                        category={category}
                        onRowClick={() => router.push(`/admin/content/configurator/${category.id}`)}
                        onDuplicate={() => duplicateCategory(category)}
                        onDelete={() => setDeleteTarget(category)}
                        duplicating={duplicating === category.id}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Catalogue Tab */}
        <TabsContent value="catalogue">
          {catalogueItems.length === 0 ? (
            <Empty className="border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CoinsIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle>{t("admin.empty.noCatalogueItems")}</EmptyTitle>
                <EmptyDescription>{t("admin.empty.noCatalogueItemsDesc")}</EmptyDescription>
              </EmptyHeader>
              <Button size="sm" onClick={openNewCatalogueSheet}>
                <PlusIcon className="size-4" />
                {t("admin.headings.newCatalogueItem")}
              </Button>
            </Empty>
          ) : (
            <div className="space-y-6">
              {catalogueCategories.map((category) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground px-1">
                    {category}
                  </h3>
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.labels.name")}</TableHead>
                        <TableHead className="hidden sm:table-cell w-32">{t("admin.labels.startingPrice")}</TableHead>
                        <TableHead className="hidden md:table-cell w-40">{t("admin.labels.unit")}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedCatalogueItems[category].map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer group"
                          onClick={() => openEditCatalogueSheet(item)}
                        >
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden sm:table-cell w-32">
                            {formatPrice(item.price_min)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell w-40">
                            {item.unit ? (
                              <Badge variant="outline">{item.unit}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="w-12">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteCatalogueTarget(item);
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
        </TabsContent>
      </Tabs>

      {/* Category Edit/Create Sheet */}
      <CategoryEditSheet
        category={editingCategory}
        siteId={currentSite?.id}
        open={categorySheetOpen}
        onOpenChange={handleCategorySheetOpenChange}
        onSaved={loadCategories}
      />

      {/* Catalogue Item Edit/Create Sheet */}
      <CatalogueItemEditSheet
        item={editingCatalogueItem}
        siteId={currentSite?.id}
        existingCategories={catalogueCategories}
        open={catalogueSheetOpen}
        onOpenChange={handleCatalogueSheetOpenChange}
        onSaved={loadCatalogue}
      />

      {/* Delete Category Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
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
              onClick={deleteCategory}
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

      {/* Delete Catalogue Item Confirmation */}
      <AlertDialog
        open={!!deleteCatalogueTarget}
        onOpenChange={() => setDeleteCatalogueTarget(null)}
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
            <AlertDialogCancel disabled={deletingCatalogue}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCatalogueItem}
              disabled={deletingCatalogue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCatalogue ? (
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

function SortableCategoryRow({
  category,
  onRowClick,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  category: ConfiguratorCategory;
  onRowClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicating: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="cursor-pointer"
      onClick={onRowClick}
    >
      <TableCell className="w-10">
        <div className="flex items-center justify-center">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon className="size-4" />
          </button>
        </div>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              disabled={duplicating}
            >
              {duplicating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {t("admin.buttons.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon className="size-4" />
              {t("admin.buttons.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
