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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDownIcon,
  EuroIcon,
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import { QuestionEditSheet } from "./sheets/QuestionEditSheet";
import { StepEditSheet } from "./sheets/StepEditSheet";
import type {
  ConfiguratorQuestion,
  ConfiguratorPricing,
  QuestionType,
} from "@/lib/configurator/types";
import type { ConfiguratorCategory } from "@/lib/configurator/categories";
import type { ConfiguratorStep } from "@/lib/configurator/steps";

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  "single-select": t("admin.misc.questionTypes.singleSelect"),
  "multi-select": t("admin.misc.questionTypes.multiSelect"),
  text: t("admin.misc.questionTypes.text"),
  number: t("admin.misc.questionTypes.number"),
};

export default function CategoryQuestionsPage({ params }: PageProps) {
  const { categoryId } = use(params);
  const router = useRouter();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } =
    useRequireFeature("configurator");
  const [category, setCategory] = useState<ConfiguratorCategory | null>(null);
  const [questions, setQuestions] = useState<ConfiguratorQuestion[]>([]);
  const [steps, setSteps] = useState<ConfiguratorStep[]>([]);
  const [loading, setLoading] = useState(true);

  // Question sheet state
  const [editingQuestion, setEditingQuestion] =
    useState<ConfiguratorQuestion | null>(null);
  const [questionSheetOpen, setQuestionSheetOpen] = useState(false);

  // Step sheet state
  const [editingStep, setEditingStep] = useState<ConfiguratorStep | null>(null);
  const [stepSheetOpen, setStepSheetOpen] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
    type: "question" | "step";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pricing state (vanafprijs only - no max)
  const [pricing, setPricing] = useState<ConfiguratorPricing | null>(null);
  const [basePrice, setBasePrice] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);
  const [originalBasePrice, setOriginalBasePrice] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      const [categoryRes, questionsRes, pricingRes, stepsRes] =
        await Promise.all([
          fetch(
            `/api/admin/configurator/categories/${categoryId}?siteId=${currentSite.id}`,
          ),
          fetch(
            `/api/admin/configurator/questions?siteId=${currentSite.id}&categoryId=${categoryId}`,
          ),
          fetch(
            `/api/admin/configurator/pricing?siteId=${currentSite.id}&categoryId=${categoryId}`,
          ),
          fetch(
            `/api/admin/configurator/steps?siteId=${currentSite.id}&categoryId=${categoryId}`,
          ),
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

      if (stepsRes.ok) {
        const stepsData = await stepsRes.json();
        setSteps(stepsData);
      }

      // Handle pricing
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        const categoryPricing = Array.isArray(pricingData)
          ? pricingData.find(
              (p: ConfiguratorPricing) => p.category_id === categoryId,
            )
          : pricingData;

        if (categoryPricing) {
          setPricing(categoryPricing);
          const priceStr = (categoryPricing.base_price_min / 100).toString();
          setBasePrice(priceStr);
          setOriginalBasePrice(priceStr);
        } else {
          setPricing(null);
          setBasePrice("");
          setOriginalBasePrice("");
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Group questions by step_id
  const questionsByStep = useMemo(() => {
    const grouped = new Map<string | null, ConfiguratorQuestion[]>();
    for (const q of questions) {
      const key = q.step_id ?? null;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(q);
    }
    return grouped;
  }, [questions]);

  const hasSteps = steps.length > 0;
  const unsteppedQuestions = questionsByStep.get(null) || [];

  // Question sheet handlers
  const openNewQuestionSheet = useCallback(() => {
    setEditingQuestion(null);
    setQuestionSheetOpen(true);
  }, []);

  const openEditQuestionSheet = (question: ConfiguratorQuestion) => {
    setEditingQuestion(question);
    setQuestionSheetOpen(true);
  };

  const handleQuestionSheetOpenChange = (open: boolean) => {
    setQuestionSheetOpen(open);
    if (!open) setEditingQuestion(null);
  };

  // Step sheet handlers
  const openNewStepSheet = useCallback(() => {
    setEditingStep(null);
    setStepSheetOpen(true);
  }, []);

  const openEditStepSheet = (step: ConfiguratorStep) => {
    setEditingStep(step);
    setStepSheetOpen(true);
  };

  const handleStepSheetOpenChange = (open: boolean) => {
    setStepSheetOpen(open);
    if (!open) setEditingStep(null);
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteTarget || !currentSite) return;

    setDeleting(true);
    try {
      const endpoint =
        deleteTarget.type === "step"
          ? `/api/admin/configurator/steps/${deleteTarget.id}?siteId=${currentSite.id}`
          : `/api/admin/configurator/questions/${deleteTarget.id}?siteId=${currentSite.id}`;

      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");

      if (deleteTarget.type === "step") {
        setSteps((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        // Unset step_id on questions that were in this step
        setQuestions((prev) =>
          prev.map((q) =>
            q.step_id === deleteTarget.id ? { ...q, step_id: null } : q,
          ),
        );
        toast.success(t("admin.messages.stepDeleted"));
      } else {
        setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
        toast.success(t("admin.messages.questionDeleted"));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(
        deleteTarget.type === "step"
          ? t("admin.messages.stepDeleteFailed")
          : t("admin.messages.questionDeleteFailed"),
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Question DnD — reorders within a given subset then persists full order
  const handleQuestionDragEnd = async (event: DragEndEvent, scope?: ConfiguratorQuestion[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentSite) return;

    const list = scope || questions;
    const oldIndex = list.findIndex((q) => q.id === active.id);
    const newIndex = list.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(list, oldIndex, newIndex);

    // Build the full questions list with this subset reordered in-place
    const reorderedIds = new Set(reordered.map((q) => q.id));
    const newQuestions: ConfiguratorQuestion[] = [];
    let ri = 0;
    for (const q of questions) {
      if (reorderedIds.has(q.id)) {
        newQuestions.push(reordered[ri++]);
      } else {
        newQuestions.push(q);
      }
    }
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
  };

  // Step DnD
  const handleStepDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && currentSite) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      setSteps(newSteps);

      try {
        await fetch("/api/admin/configurator/steps/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newSteps.map((s) => s.id),
            siteId: currentSite.id,
          }),
        });
      } catch (error) {
        console.error("Failed to reorder steps:", error);
        toast.error(t("admin.messages.orderSaveFailed"));
        loadData();
      }
    }
  };

  // Pricing functions
  const hasPricingChanges = useMemo(() => {
    return basePrice !== originalBasePrice;
  }, [basePrice, originalBasePrice]);

  const savePricing = useCallback(async () => {
    if (!currentSite) return;

    const priceCents = Math.round(parseFloat(basePrice || "0") * 100);

    if (priceCents <= 0) {
      toast.error("Vul een geldige vanafprijs in");
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
          base_price_min: priceCents,
          base_price_max: priceCents,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success(t("admin.messages.pricingSaved"));
      setOriginalBasePrice(basePrice);
    } catch (error) {
      console.error("Failed to save pricing:", error);
      toast.error(t("admin.messages.pricingSaveFailed"));
    } finally {
      setSavingPricing(false);
    }
  }, [currentSite, categoryId, basePrice]);

  // Header actions
  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={openNewStepSheet}>
          <PlusIcon className="size-4" />
          {t("admin.headings.newStep")}
        </Button>
        <Button size="sm" onClick={openNewQuestionSheet}>
          <PlusIcon className="size-4" />
          {t("admin.headings.newQuestion")}
        </Button>
      </div>
    ),
    [openNewQuestionSheet, openNewStepSheet],
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

  // Render question table for a list of questions
  const renderQuestionTable = (
    questionList: ConfiguratorQuestion[],
    dndEnabled: boolean,
  ) => {
    if (questionList.length === 0) return null;

    const table = (
      <Table>
        <TableHeader>
          <TableRow>
            {dndEnabled && <TableHead className="w-10"></TableHead>}
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
          {questionList.map((question) => (
            <SortableRow
              key={question.id}
              id={question.id}
              disabled={!dndEnabled}
              onClick={() => openEditQuestionSheet(question)}
              onDelete={() =>
                setDeleteTarget({
                  id: question.id,
                  label: question.label,
                  type: "question",
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
    );

    if (!dndEnabled) return table;

    return (
      <SortableContext
        items={questionList.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        {table}
      </SortableContext>
    );
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="space-y-4 md:col-span-2">
          {questions.length === 0 && steps.length === 0 ? (
            <Empty className="border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SlidersHorizontalIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle>{t("admin.empty.noQuestions")}</EmptyTitle>
                <EmptyDescription>
                  {t("admin.empty.noQuestionsDesc")}
                </EmptyDescription>
              </EmptyHeader>
              <Button size="sm" onClick={openNewQuestionSheet}>
                <PlusIcon className="size-4" />
                {t("admin.headings.newQuestion")}
              </Button>
            </Empty>
          ) : hasSteps ? (
            /* Step-grouped view */
            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleStepDragEnd}
              >
                <SortableContext
                  items={steps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {steps.map((step) => {
                    const stepQuestions = questionsByStep.get(step.id) || [];
                    return (
                      <SortableStepCard
                        key={step.id}
                        step={step}
                        questionCount={stepQuestions.length}
                        onEdit={() => openEditStepSheet(step)}
                        onDelete={() =>
                          setDeleteTarget({
                            id: step.id,
                            label: step.name,
                            type: "step",
                          })
                        }
                      >
                        {stepQuestions.length > 0 ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleQuestionDragEnd(e, stepQuestions)}
                          >
                            {renderQuestionTable(stepQuestions, true)}
                          </DndContext>
                        ) : (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            {t("admin.empty.noQuestions")}
                          </p>
                        )}
                      </SortableStepCard>
                    );
                  })}
                </SortableContext>
              </DndContext>

              {/* Unstepped questions */}
              {unsteppedQuestions.length > 0 && (
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("admin.misc.questionsWithoutStep")}
                    </span>
                    <Badge variant="secondary">
                      {unsteppedQuestions.length}
                    </Badge>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleQuestionDragEnd(e, unsteppedQuestions)}
                  >
                    {renderQuestionTable(unsteppedQuestions, true)}
                  </DndContext>
                </div>
              )}
            </div>
          ) : (
            /* Flat question list (no steps) */
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleQuestionDragEnd(e)}
            >
              {renderQuestionTable(questions, true)}
            </DndContext>
          )}
        </div>

        {/* Sidebar - Pricing */}
        <div className="bg-muted sticky top-4 flex h-fit flex-col gap-4 rounded-lg p-4">
          <FieldGroup>
            <Field>
              <FieldLabel
                htmlFor="base-price"
                className="flex items-center gap-1.5"
              >
                <EuroIcon className="size-4 opacity-80" />
                {t("admin.labels.startingPrice")} (EUR)
              </FieldLabel>
              <Input
                id="base-price"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="5000"
              />
            </Field>
          </FieldGroup>

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

      {/* Question Edit/Create Sheet */}
      <QuestionEditSheet
        question={editingQuestion}
        categoryId={categoryId}
        siteId={currentSite?.id}
        steps={steps}
        open={questionSheetOpen}
        onOpenChange={handleQuestionSheetOpenChange}
        onSaved={(savedQuestion) => {
          if (editingQuestion) {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === savedQuestion.id ? savedQuestion : q,
              ),
            );
          } else {
            setQuestions((prev) => [...prev, savedQuestion]);
          }
        }}
      />

      {/* Step Edit/Create Sheet */}
      <StepEditSheet
        step={editingStep}
        categoryId={categoryId}
        siteId={currentSite?.id}
        open={stepSheetOpen}
        onOpenChange={handleStepSheetOpenChange}
        onSaved={(savedStep) => {
          if (editingStep) {
            setSteps((prev) =>
              prev.map((s) => (s.id === savedStep.id ? savedStep : s)),
            );
          } else {
            setSteps((prev) => [...prev, savedStep]);
          }
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "step"
                ? t("admin.misc.deleteStepQuestion")
                : t("admin.misc.deleteQuestionQuestion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "step" ? (
                <>
                  &quot;{deleteTarget?.label}&quot;{" "}
                  {t("admin.misc.deleteStepDesc")}
                </>
              ) : (
                <>
                  &quot;{deleteTarget?.label}&quot;{" "}
                  {t("admin.dialogs.permanentDelete")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
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

// =============================================================================
// Sortable step card
// =============================================================================

function SortableStepCard({
  step,
  questionCount,
  onEdit,
  onDelete,
  children,
}: {
  step: ConfiguratorStep;
  questionCount: number;
  onEdit: () => void;
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
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Collapsible defaultOpen>
      <div ref={setNodeRef} style={style} className="rounded-lg border">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-b-transparent [[data-state=open]_&]:border-b-border bg-muted/50">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          >
            <GripVerticalIcon className="size-4" />
          </button>
          <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform [[data-state=closed]_&]:-rotate-90" />
            <span className="text-sm font-medium truncate">{step.name}</span>
            <Badge variant="secondary">{questionCount}</Badge>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={onEdit}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        </div>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// =============================================================================
// Sortable question row
// =============================================================================

function SortableRow({
  id,
  onClick,
  onDelete,
  disabled = false,
  children,
}: {
  id: string;
  onClick: () => void;
  onDelete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

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
      {!disabled && (
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
      )}
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
