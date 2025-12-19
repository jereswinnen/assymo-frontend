"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Section, SectionType, SECTION_TYPES, createSection } from "@/types/sections";

interface AddSectionButtonProps {
  onAdd: (section: Section) => void;
}

export function AddSectionButton({ onAdd }: AddSectionButtonProps) {
  const handleAdd = (type: SectionType) => {
    const section = createSection(type);
    onAdd(section);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="size-4" />
          Sectie toevoegen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {SECTION_TYPES.map(({ type, label, description }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => handleAdd(type)}
            className="flex flex-col items-start gap-0.5 py-2"
          >
            <span className="font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
