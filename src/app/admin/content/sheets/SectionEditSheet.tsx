"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Section, getSectionLabel } from "@/types/sections";
import { SectionForm } from "@/components/admin/SectionForm";

interface SectionEditSheetProps {
  section: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (section: Section) => void;
  onSave?: () => void;
  saving?: boolean;
  hasChanges?: boolean;
}

export function SectionEditSheet({
  section,
  open,
  onOpenChange,
  onChange,
  onSave,
  saving = false,
  hasChanges = false,
}: SectionEditSheetProps) {
  const handleSave = () => {
    if (onSave) {
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="px-4 w-full md:max-w-xl overflow-y-auto"
      >
        <SheetHeader className="px-0">
          <SheetTitle>
            {section && getSectionLabel(section._type)}
          </SheetTitle>
          <SheetDescription>
            Bewerk de inhoud van deze sectie.
          </SheetDescription>
        </SheetHeader>
        {section && (
          <SectionForm section={section} onChange={onChange} />
        )}
        {onSave && (
          <SheetFooter className="px-0">
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  Opslaan
                </>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
