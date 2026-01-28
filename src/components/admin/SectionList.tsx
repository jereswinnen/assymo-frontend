"use client";

import { useState } from "react";
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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BlocksIcon,
  ClipboardCopyIcon,
  CopyIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { toast } from "sonner";
import { Section, getSectionLabel } from "@/types/sections";
import { AddSectionButton } from "./AddSectionButton";
import { PasteSectionButton, CLIPBOARD_KEY } from "./PasteSectionButton";
import { SectionEditSheet } from "@/app/(admin)/admin/content/sheets/SectionEditSheet";
import { t } from "@/config/strings";

interface SortableSectionRowProps {
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
}

function SortableSectionRow({
  section,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
}: SortableSectionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section._key });

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
      onClick={onEdit}
    >
      <TableCell className="w-10">
        <div className="flex items-center justify-center">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none align-text-bottom text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon className="size-4" />
          </button>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {getSectionLabel(section._type)}
      </TableCell>
      <TableCell className="w-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onDuplicate}>
              <CopyIcon className="size-4" />
              {t("admin.buttons.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy}>
              <ClipboardCopyIcon className="size-4" />
              {t("admin.buttons.copy")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="size-4 text-destructive" />
              {t("admin.buttons.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

interface SectionListProps {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  onSave?: () => void;
  saving?: boolean;
  hasChanges?: boolean;
  showAddButton?: boolean;
}

export function SectionList({
  sections,
  onChange,
  onSave,
  saving = false,
  hasChanges = false,
  showAddButton = true,
}: SectionListProps) {
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s._key === active.id);
    const newIndex = sections.findIndex((s) => s._key === over.id);

    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  const handleAdd = (section: Section) => {
    onChange([...sections, section]);
  };

  const handleUpdate = (updatedSection: Section) => {
    const newSections = sections.map((s) =>
      s._key === updatedSection._key ? updatedSection : s,
    );
    onChange(newSections);
    setEditingSection(updatedSection);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onChange(sections.filter((s) => s._key !== deleteTarget));
    setDeleteTarget(null);
  };

  const handleDuplicate = (sectionKey: string) => {
    const sectionIndex = sections.findIndex((s) => s._key === sectionKey);
    if (sectionIndex === -1) return;

    const section = sections[sectionIndex];
    const duplicated = {
      ...JSON.parse(JSON.stringify(section)),
      _key: crypto.randomUUID(),
    } as Section;

    // Insert the duplicate right after the original
    const newSections = [
      ...sections.slice(0, sectionIndex + 1),
      duplicated,
      ...sections.slice(sectionIndex + 1),
    ];
    onChange(newSections);
    toast.success(t("admin.messages.sectionDuplicated"));
  };

  const handleCopy = (section: Section) => {
    try {
      localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(section));
      // Dispatch custom event for same-tab updates (storage event only fires cross-tab)
      window.dispatchEvent(new CustomEvent("sectionClipboardChange"));
      toast.success(t("admin.messages.sectionCopied"));
    } catch {
      toast.error(t("admin.messages.somethingWentWrongShort"));
    }
  };

  const handlePaste = (section: Section) => {
    onChange([...sections, section]);
  };

  const handleSave = async () => {
    if (onSave) {
      onSave();
      setEditingSection(null);
    }
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BlocksIcon />
            </EmptyMedia>
            <EmptyTitle>{t("admin.misc.noSections")}</EmptyTitle>
            <EmptyDescription>
              {t("admin.messages.addSections")}
            </EmptyDescription>
          </EmptyHeader>
          {showAddButton && (
            <div className="flex items-center gap-2">
              <AddSectionButton onAdd={handleAdd} />
              <PasteSectionButton onPaste={handlePaste} />
            </div>
          )}
        </Empty>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s._key)}
              strategy={verticalListSortingStrategy}
            >
              <Table>
                <TableBody>
                  {sections.map((section) => (
                    <SortableSectionRow
                      key={section._key}
                      section={section}
                      onEdit={() => setEditingSection(section)}
                      onDelete={() => setDeleteTarget(section._key)}
                      onDuplicate={() => handleDuplicate(section._key)}
                      onCopy={() => handleCopy(section)}
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
          {showAddButton && (
            <div className="flex items-center gap-2">
              <AddSectionButton onAdd={handleAdd} />
              <PasteSectionButton onPaste={handlePaste} />
            </div>
          )}
        </>
      )}

      {/* Edit Section Sheet */}
      <SectionEditSheet
        section={editingSection}
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        onChange={handleUpdate}
        onSave={onSave ? handleSave : undefined}
        saving={saving}
        hasChanges={hasChanges}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.headings.deleteSectionQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteSectionDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
