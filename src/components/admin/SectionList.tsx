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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import { Section, getSectionLabel } from "@/types/sections";
import { AddSectionButton } from "./AddSectionButton";
import { SectionForm } from "./SectionForm";

interface SortableSectionProps {
  section: Section;
  onUpdate: (section: Section) => void;
  onDelete: () => void;
}

function SortableSection({
  section,
  onUpdate,
  onDelete,
}: SortableSectionProps) {
  const [expanded, setExpanded] = useState(false);
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
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-transparent hover:bg-muted/50">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </button>
        <span className="font-medium flex-1 text-sm">
          {getSectionLabel(section._type)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={onDelete}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
      {expanded && (
        <div className="p-4 border-t bg-muted/30">
          <SectionForm section={section} onChange={onUpdate} />
        </div>
      )}
    </Card>
  );
}

interface SectionListProps {
  sections: Section[];
  onChange: (sections: Section[]) => void;
}

export function SectionList({ sections, onChange }: SectionListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const handleUpdate = (index: number, section: Section) => {
    const newSections = [...sections];
    newSections[index] = section;
    onChange(newSections);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onChange(sections.filter((s) => s._key !== deleteTarget));
    setDeleteTarget(null);
  };

  const sectionToDelete = sections.find((s) => s._key === deleteTarget);

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">Nog geen secties toegevoegd</p>
          <AddSectionButton onAdd={handleAdd} />
        </div>
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
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <SortableSection
                    key={section._key}
                    section={section}
                    onUpdate={(updated) => handleUpdate(index, updated)}
                    onDelete={() => setDeleteTarget(section._key)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <AddSectionButton onAdd={handleAdd} />
        </>
      )}

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
