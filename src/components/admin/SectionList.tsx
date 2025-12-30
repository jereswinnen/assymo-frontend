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
  BlocksIcon,
  GripVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Section, getSectionLabel } from "@/types/sections";
import { AddSectionButton } from "./AddSectionButton";
import { SectionEditSheet } from "@/app/admin/content/sheets/SectionEditSheet";

interface SortableSectionRowProps {
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableSectionRow({
  section,
  onEdit,
  onDelete,
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

  const handleSave = async () => {
    if (onSave) {
      onSave();
      setEditingSection(null);
    }
  };

  const sectionToDelete = sections.find((s) => s._key === deleteTarget);

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BlocksIcon />
            </EmptyMedia>
            <EmptyTitle>Geen secties</EmptyTitle>
            <EmptyDescription>
              Voeg secties toe om de inhoud van deze pagina op te bouwen.
            </EmptyDescription>
          </EmptyHeader>
          {showAddButton && <AddSectionButton onAdd={handleAdd} />}
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
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
          {showAddButton && <AddSectionButton onAdd={handleAdd} />}
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
            <AlertDialogTitle>Sectie verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je de{" "}
              {sectionToDelete && getSectionLabel(sectionToDelete._type)} sectie
              wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
