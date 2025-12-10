"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getTestEmail, setTestEmail } from "@/lib/adminSettings";
import { DEFAULT_TEST_EMAIL } from "@/config/resend";

interface SettingsPanelProps {
  onHasChangesChange?: (hasChanges: boolean) => void;
  triggerSave?: number;
  onSaveComplete?: () => void;
}

export function SettingsPanel({
  onHasChangesChange,
  triggerSave,
  onSaveComplete,
}: SettingsPanelProps) {
  const [testEmail, setTestEmailState] = useState(DEFAULT_TEST_EMAIL);
  const [originalEmail, setOriginalEmail] = useState(DEFAULT_TEST_EMAIL);

  useEffect(() => {
    const saved = getTestEmail();
    setTestEmailState(saved);
    setOriginalEmail(saved);
  }, []);

  // Track changes
  useEffect(() => {
    onHasChangesChange?.(testEmail !== originalEmail);
  }, [testEmail, originalEmail, onHasChangesChange]);

  // Handle external save trigger
  useEffect(() => {
    if (triggerSave && triggerSave > 0) {
      handleSave();
    }
  }, [triggerSave]);

  const handleSave = () => {
    const trimmed = testEmail.trim();
    if (!trimmed) {
      toast.error("Vul een e-mailadres in");
      onSaveComplete?.();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Vul een geldig e-mailadres in");
      onSaveComplete?.();
      return;
    }

    setTestEmail(trimmed);
    setTestEmailState(trimmed);
    setOriginalEmail(trimmed);
    toast.success("Instellingen opgeslagen");
    onSaveComplete?.();
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test e-mailadres</Label>
          <Input
            id="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmailState(e.target.value)}
            placeholder={DEFAULT_TEST_EMAIL}
          />
          <p className="text-xs text-muted-foreground">
            Dit e-mailadres wordt gebruikt voor nieuwsbrief tests (Test
            versturen). Opgeslagen in je browser.
          </p>
        </div>
      </div>

    </div>
  );
}
