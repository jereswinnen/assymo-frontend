"use client";

import { useState, useEffect, useMemo, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import {
  useAdminHeaderActions,
  useAdminBreadcrumbTitle,
} from "@/components/admin/AdminHeaderContext";
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
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
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
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import { QuestionEditSheet } from "./sheets/QuestionEditSheet";
import type { ConfiguratorQuestion, ConfiguratorPricing, QuestionType } from "@/lib/configurator/types";
import type { ConfiguratorCategory } from "@/lib/configurator/categories";

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  "single-select": t("admin.misc.questionTypes.singleSelect"),
  "multi-select": t("admin.misc.questionTypes.multiSelect"),
  text: t("admin.misc.questionTypes.text"),
  number: t("admin.misc.questionTypes.number"),
  dimensions: t("admin.misc.questionTypes.dimensions"),
};

export default function CategoryQuestionsPage({ params }: PageProps) {
  const { categoryId } = use(params);
  const router = useRouter();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");
  const [category, setCategory] = useState<ConfiguratorCategory | null>(null);
  const [questions, setQuestions] = useState<ConfiguratorQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [editingQuestion, setEditingQuestion] = useState<ConfiguratorQuestion | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pricing state
  const [pricing, setPricing] = useState<ConfiguratorPricing | null>(null);
  const [basePriceMin, setBasePriceMin] = useState("");
  const [basePriceMax, setBasePriceMax] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);
  const [originalPricing, setOriginalPricing] = useState({
    basePriceMin: "",
    basePriceMax: "",
  });

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
  }, [currentSite, siteLoading, categoryId]);

  const loadData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      // Fetch category details, questions, and pricing in parallel
      const [categoryRes, questionsRes, pricingRes] = await Promise.all([
        fetch(`/api/admin/configurator/categories/${categoryId}?siteId=${currentSite.id}`),
        fetch(`/api/admin/configurator/questions?siteId=${currentSite.id}&categoryId=${categoryId}`),
        fetch(`/api/admin/configurator/pricing?siteId=${currentSite.id}&categoryId=${categoryId}`),
      ]);

      if (!categoryRes.ok) {
        if (categoryRes.status === 404) {
          toast.error("Configurator item niet gevonden");
          router.push("/admin/content/configurator");
          return;
        }
        throw new Error("Failed to fetch category");
      }

      const categoryData = await categoryRes.json();
      setCategory(categoryData);

      if (!questionsRes.ok) throw new Error("Failed to fetch questions");
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);

      // Handle pricing
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        const categoryPricing = Array.isArray(pricingData)
          ? pricingData.find((p: ConfiguratorPricing) => p.category_id === categoryId)
          : pricingData;

        if (categoryPricing) {
          setPricing(categoryPricing);
          const minStr = (categoryPricing.base_price_min / 100).toString();
          const maxStr = (categoryPricing.base_price_max / 100).toString();
          setBasePriceMin(minStr);
          setBasePriceMax(maxStr);
          setOriginalPricing({
            basePriceMin: minStr,
            basePriceMax: maxStr,
          });
        } else {
          setPricing(null);
          setBasePriceMin("");
          setBasePriceMax("");
          setOriginalPricing({ basePriceMin: "", basePriceMax: "" });
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Sheet handlers
  const openNewQuestionSheet = useCallback(() => {
    setEditingQuestion(null);
    setSheetOpen(true);
  }, []);

  const openEditQuestionSheet = (question: ConfiguratorQuestion) => {
    setEditingQuestion(question);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingQuestion(null);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteTarget || !currentSite) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/configurator/questions/${deleteTarget.id}?siteId=${currentSite.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");

      toast.success(t("admin.messages.questionDeleted"));
      loadData();
    } catch (error) {
      console.error("Failed to delete question:", error);
      toast.error(t("admin.messages.questionDeleteFailed"));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentSite) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);

      try {
        await fetch("/api/admin/configurator/questions/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newQuestions.map((q) => q.id),
            siteId: currentSite.id,
          }),
        });
      } catch (error) {
        console.error("Failed to reorder questions:", error);
        toast.error(t("admin.messages.orderSaveFailed"));
        loadData();
      }
    }
  };

  // Pricing functions
  const hasPricingChanges = useMemo(() => {
    return (
      basePriceMin !== originalPricing.basePriceMin ||
      basePriceMax !== originalPricing.basePriceMax
    );
  }, [basePriceMin, basePriceMax, originalPricing]);

  const savePricing = useCallback(async () => {
    if (!currentSite) return;

    const minCents = Math.round(parseFloat(basePriceMin || "0") * 100);
    const maxCents = Math.round(parseFloat(basePriceMax || "0") * 100);

    if (minCents <= 0 || maxCents <= 0) {
      toast.error("Vul geldige prijzen in");
      return;
    }

    if (minCents > maxCents) {
      toast.error("Minimumprijs moet lager zijn dan maximumprijs");
      return;
    }

    setSavingPricing(true);
    try {
      const response = await fetch("/api/admin/configurator/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: currentSite.id,
          category_id: categoryId,
          base_price_min: minCents,
          base_price_max: maxCents,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success(t("admin.messages.pricingSaved"));
      // Update original values
      setOriginalPricing({
        basePriceMin,
        basePriceMax,
      });
    } catch (error) {
      console.error("Failed to save pricing:", error);
      toast.error(t("admin.messages.pricingSaveFailed"));
    } finally {
      setSavingPricing(false);
    }
  }, [currentSite, categoryId, basePriceMin, basePriceMax]);

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewQuestionSheet}>
        <PlusIcon className="size-4" />
        {t("admin.headings.newQuestion")}
      </Button>
    ),
    [openNewQuestionSheet]
  );
  useAdminHeaderActions(headerActions);
  useAdminBreadcrumbTitle(category?.name || null);

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
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - Questions */}
        <div className="space-y-4 md:col-span-2">
          {questions.length === 0 ? (
            <Empty className="border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SlidersHorizontalIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle>{t("admin.empty.noQuestions")}</EmptyTitle>
                <EmptyDescription>{t("admin.empty.noQuestionsDesc")}</EmptyDescription>
              </EmptyHeader>
              <Button size="sm" onClick={openNewQuestionSheet}>
                <PlusIcon className="size-4" />
                {t("admin.headings.newQuestion")}
              </Button>
            </Empty>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>{t("admin.labels.label")}</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {t("admin.labels.questionType")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.labels.required")}
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <SortableRow
                        key={question.id}
                        id={question.id}
                        onClick={() => openEditQuestionSheet(question)}
                        onDelete={() =>
                          setDeleteTarget({
                            id: question.id,
                            label: question.label,
                          })
                        }
                      >
                        <TableCell className="font-medium">{question.label}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          <Badge variant="outline">
                            {QUESTION_TYPE_LABELS[question.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {question.required ? (
                            <Badge variant="default">{t("admin.misc.yes")}</Badge>
                          ) : (
                            <Badge variant="secondary">{t("admin.misc.no")}</Badge>
                          )}
                        </TableCell>
                      </SortableRow>
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Sidebar - Base Pricing */}
        <div className="bg-muted sticky top-4 flex h-fit flex-col rounded-lg p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <CoinsIcon className="size-4" />
            {t("admin.headings.pricing")}
          </h3>

          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="base-price-min">
                  {t("admin.labels.basePriceMin")} (EUR)
                </FieldLabel>
                <Input
                  id="base-price-min"
                  type="number"
                  value={basePriceMin}
                  onChange={(e) => setBasePriceMin(e.target.value)}
                  placeholder="35000"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="base-price-max">
                  {t("admin.labels.basePriceMax")} (EUR)
                </FieldLabel>
                <Input
                  id="base-price-max"
                  type="number"
                  value={basePriceMax}
                  onChange={(e) => setBasePriceMax(e.target.value)}
                  placeholder="75000"
                />
              </Field>
            </FieldSet>
          </FieldGroup>

          {/* Save button */}
          <div className="mt-4 border-t pt-4">
            <Button
              size="sm"
              className="w-full"
              onClick={savePricing}
              disabled={savingPricing || !hasPricingChanges}
            >
              {savingPricing ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              {t("admin.buttons.savePricing")}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit/Create Sheet */}
      <QuestionEditSheet
        question={editingQuestion}
        categoryId={categoryId}
        siteId={currentSite?.id}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSaved={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.deleteQuestionQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.label}&quot; {t("admin.dialogs.permanentDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteQuestion}
              disabled={deleting}
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

function SortableRow({
  id,
  onClick,
  onDelete,
  children,
}: {
  id: string;
  onClick: () => void;
  onDelete: () => void;
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
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
