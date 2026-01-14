"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClipboardPasteIcon } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/types/sections";
import { t } from "@/config/strings";

const CLIPBOARD_KEY = "assymo_copied_section";

interface PasteSectionButtonProps {
  onPaste: (section: Section) => void;
}

export function PasteSectionButton({ onPaste }: PasteSectionButtonProps) {
  const [hasClipboard, setHasClipboard] = useState(false);

  const checkClipboard = useCallback(() => {
    try {
      const stored = localStorage.getItem(CLIPBOARD_KEY);
      setHasClipboard(!!stored);
    } catch {
      setHasClipboard(false);
    }
  }, []);

  useEffect(() => {
    checkClipboard();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CLIPBOARD_KEY) {
        checkClipboard();
      }
    };

    // Listen for custom event for same-tab updates
    const handleClipboardChange = () => {
      checkClipboard();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sectionClipboardChange", handleClipboardChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sectionClipboardChange", handleClipboardChange);
    };
  }, [checkClipboard]);

  const handlePaste = () => {
    try {
      const stored = localStorage.getItem(CLIPBOARD_KEY);
      if (!stored) return;

      const section = JSON.parse(stored) as Section;
      const pasted = {
        ...section,
        _key: crypto.randomUUID(),
      } as Section;

      onPaste(pasted);
      toast.success(t("admin.messages.sectionPasted"));
    } catch {
      toast.error(t("admin.messages.somethingWentWrongShort"));
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handlePaste}
          disabled={!hasClipboard}
        >
          <ClipboardPasteIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {hasClipboard ? t("admin.buttons.paste") : t("admin.misc.clipboardEmpty")}
      </TooltipContent>
    </Tooltip>
  );
}

// Export clipboard key for use in SectionList
export { CLIPBOARD_KEY };
