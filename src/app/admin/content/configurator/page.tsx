"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { toast } from "sonner";
import {
  ChevronRightIcon,
  CoinsIcon,
  GripVerticalIcon,
  ListIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";
import { t } from "@/config/strings";
import { CategoryEditSheet } from "./sheets/CategoryEditSheet";
import type { ConfiguratorQuestion, ConfiguratorPricing } from "@/lib/configurator/types";
import type { ConfiguratorCategory } from "@/lib/configurator/categories";

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  hasPricing: boolean;
}

export default function ConfiguratorPage() {
  const router = useRouter();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState<ConfiguratorCategory[]>([]);
  const [questions, setQuestions] = useState<ConfiguratorQuestion[]>([]);
  const [pricing, setPricing] = useState<ConfiguratorPricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingCategory, setEditingCategory] = useState<ConfiguratorCategory | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!siteLoading && currentSite) {
      loadData();
    }
  }, [currentSite, siteLoading]);

  const loadData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const [categoriesRes, questionsRes, pricingRes] = await Promise.all([
        fetch(`/api/admin/configurator/categories?siteId=${currentSite.id}`),
        fetch(`/api/admin/configurator/questions?siteId=${currentSite.id}`),
        fetch(`/api/admin/configurator/pricing?siteId=${currentSite.id}`),
      ]);

      if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
      if (!questionsRes.ok) throw new Error("Failed to fetch questions");
      if (!pricingRes.ok) throw new Error("Failed to fetch pricing");

      const [categoriesData, questionsData, pricingData] = await Promise.all([
        categoriesRes.json(),
        questionsRes.json(),
        pricingRes.json(),
      ]);

      setCategories(categoriesData);
      setQuestions(questionsData);
      setPricing(pricingData);
    } catch (error) {
      console.error("Failed to load configurator data:", error);
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Build category summaries
  const categorySummaries: CategorySummary[] = useMemo(() => {
    // Count questions per category
    const questionCounts = new Map<string, number>();
    for (const q of questions) {
      if (q.category_id) {
        questionCounts.set(
          q.category_id,
          (questionCounts.get(q.category_id) || 0) + 1
        );
      }
    }

    // Check pricing per category
    const pricingMap = new Map(
      pricing
        .filter((p) => p.category_id)
        .map((p) => [p.category_id, p])
    );

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      questionCount: questionCounts.get(cat.id) || 0,
      hasPricing: pricingMap.has(cat.id),
    }));
  }, [categories, questions, pricing]);

  // Sheet handlers
  const openNewCategorySheet = useCallback(() => {
    setEditingCategory(null);
    setSheetOpen(true);
  }, []);

  const openEditCategorySheet = (category: ConfiguratorCategory) => {
    setEditingCategory(category);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
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
        loadData();
      }
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewCategorySheet}>
        <PlusIcon className="size-4" />
        {t("admin.buttons.addItem")}
      </Button>
    ),
    [openNewCategorySheet]
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">
            <ListIcon className="size-4" />
            {t("admin.headings.configuratorItems")}
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <CoinsIcon className="size-4" />
            {t("admin.headings.pricing")}
          </TabsTrigger>
        </TabsList>

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
                      <TableHead className="text-right">{t("admin.headings.questions")}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorySummaries.map((category) => (
                      <SortableCategoryRow
                        key={category.id}
                        id={category.id}
                        onClick={() => router.push(`/admin/content/configurator/${category.id}`)}
                        onEdit={() => {
                          const cat = categories.find((c) => c.id === category.id);
                          if (cat) openEditCategorySheet(cat);
                        }}
                      >
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {category.questionCount} {category.questionCount === 1 ? "vraag" : "vragen"}
                        </TableCell>
                      </SortableCategoryRow>
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="pricing">
          <PricingTable categories={categorySummaries} pricing={pricing} />
        </TabsContent>
      </Tabs>

      {/* Edit/Create Sheet */}
      <CategoryEditSheet
        category={editingCategory}
        siteId={currentSite?.id}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSaved={loadData}
      />
    </>
  );
}

function SortableCategoryRow({
  id,
  onClick,
  onEdit,
  children,
}: {
  id: string;
  onClick: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="group cursor-pointer"
      onClick={onClick}
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
      {children}
      <TableCell className="w-10">
        <ChevronRightIcon className="size-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
}

function PricingTable({
  categories,
  pricing,
}: {
  categories: CategorySummary[];
  pricing: ConfiguratorPricing[];
}) {
  const router = useRouter();
  const pricingMap = new Map(
    pricing
      .filter((p) => p.category_id)
      .map((p) => [p.category_id, p])
  );

  if (categories.length === 0) {
    return (
      <Empty className="border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CoinsIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>{t("admin.empty.noPricing")}</EmptyTitle>
          <EmptyDescription>
            Maak eerst een configurator item aan om prijzen te configureren.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("admin.labels.name")}</TableHead>
          <TableHead>{t("admin.labels.basePriceMin")}</TableHead>
          <TableHead>{t("admin.labels.basePriceMax")}</TableHead>
          <TableHead>{t("admin.labels.status")}</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => {
          const p = pricingMap.get(category.id);
          return (
            <TableRow
              key={category.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/content/configurator/pricing?categoryId=${category.id}`)}
            >
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                {p ? formatPrice(p.base_price_min) : "-"}
              </TableCell>
              <TableCell>
                {p ? formatPrice(p.base_price_max) : "-"}
              </TableCell>
              <TableCell>
                {p ? (
                  <Badge variant="default">{t("admin.misc.active")}</Badge>
                ) : (
                  <Badge variant="secondary">{t("admin.misc.inactive")}</Badge>
                )}
              </TableCell>
              <TableCell>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Helper functions
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
