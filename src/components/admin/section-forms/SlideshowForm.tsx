"use client";

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
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { SlideshowSection } from "@/types/sections";
import { Separator } from "@/components/ui/separator";

interface SlideshowImage {
  _key: string;
  image: { url: string; alt?: string };
  caption?: string;
}

interface SortableImageItemProps {
  image: SlideshowImage;
  onUpdate: (updates: Partial<SlideshowImage>) => void;
  onRemove: () => void;
}

function SortableImageItem({
  image,
  onUpdate,
  onRemove,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image._key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 space-y-4 border rounded-lg"
    >
      <ImageUpload
        value={image.image?.url ? image.image : null}
        onChange={(value) =>
          onUpdate({
            image: value || { url: "", alt: "" },
          })
        }
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <Button
          className="text-destructive"
          variant="secondary"
          size="sm"
          onClick={onRemove}
        >
          <Trash2Icon className="size-4" />
          Item verwijderen
        </Button>
      </div>
    </div>
  );
}

interface SlideshowFormProps {
  section: SlideshowSection;
  onChange: (section: SlideshowSection) => void;
}

export function SlideshowForm({ section, onChange }: SlideshowFormProps) {
  const images = section.images || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img._key === active.id);
    const newIndex = images.findIndex((img) => img._key === over.id);

    onChange({ ...section, images: arrayMove(images, oldIndex, newIndex) });
  };

  const addImage = () => {
    const newImage: SlideshowImage = {
      _key: crypto.randomUUID(),
      image: { url: "", alt: "" },
      caption: "",
    };
    onChange({ ...section, images: [...images, newImage] });
  };

  const updateImage = (index: number, updates: Partial<SlideshowImage>) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    onChange({ ...section, images: newImages });
  };

  const removeImage = (index: number) => {
    onChange({ ...section, images: images.filter((_, i) => i !== index) });
  };

  return (
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="background">Achtergrond</FieldLabel>
        <Switch
          id="background"
          checked={section.background || false}
          onCheckedChange={(checked) =>
            onChange({ ...section, background: checked })
          }
        />
      </Field>

      <Separator />

      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <FieldLabel>Afbeeldingen</FieldLabel>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            <PlusIcon className="size-4" />
            Afbeelding toevoegen
          </Button>
        </header>

        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen afbeeldingen toegevoegd
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img._key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {images.map((img, index) => (
                  <SortableImageItem
                    key={img._key}
                    image={img}
                    onUpdate={(updates) => updateImage(index, updates)}
                    onRemove={() => removeImage(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </FieldGroup>
  );
}
