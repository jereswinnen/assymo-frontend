"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveIcon, MailIcon, CheckIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { getTestEmail, setTestEmail } from "@/lib/adminSettings";
import { DEFAULT_TEST_EMAIL } from "@/config/resend";

export function SettingsPanel() {
  const [testEmail, setTestEmailState] = useState(DEFAULT_TEST_EMAIL);

  useEffect(() => {
    setTestEmailState(getTestEmail());
  }, []);

  const handleSave = () => {
    const trimmed = testEmail.trim();
    if (!trimmed) {
      toast.error("Vul een e-mailadres in");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Vul een geldig e-mailadres in");
      return;
    }

    setTestEmail(trimmed);
    setTestEmailState(trimmed);
    toast.success("Instellingen opgeslagen");
  };

  const handleReset = () => {
    setTestEmail(DEFAULT_TEST_EMAIL);
    setTestEmailState(DEFAULT_TEST_EMAIL);
    toast.success("Teruggezet naar standaardwaarde");
  };

  return (
    <Card className="h-full overflow-auto">
      <CardContent>
        <div className="space-y-8">
          <div className="max-w-md space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MailIcon className="size-4" />
                <span className="text-sm font-medium">E-mail instellingen</span>
              </div>

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
                  Dit e-mailadres wordt gebruikt voor nieuwsbrief tests ("Test
                  versturen"). Opgeslagen in je browser.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave}>
                <CheckIcon className="size-4" />
                Opslaan
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcwIcon className="size-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
