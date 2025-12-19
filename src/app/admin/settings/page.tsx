"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { DocumentEmbeddings } from "@/components/admin/DocumentEmbeddings";
import { SecuritySettings } from "@/components/admin/SecuritySettings";
import {
  CheckIcon,
  ListTreeIcon,
  Loader2Icon,
  LockIcon,
  ScanTextIcon,
  ShieldCheckIcon,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  // Lifted state for SettingsPanel
  const [settingsHasChanges, setSettingsHasChanges] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [triggerSettingsSave, setTriggerSettingsSave] = useState(0);

  const handleSaveSettings = () => {
    setSettingsSaving(true);
    setTriggerSettingsSave((n) => n + 1);
  };

  const handleSettingsSaveComplete = () => {
    setSettingsSaving(false);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4"
      id="settings-tabs"
    >
      <header className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="general">
            <ListTreeIcon className="size-4" />
            Algemeen
          </TabsTrigger>
          <TabsTrigger value="embeddings">
            <ScanTextIcon className="size-4" />
            Embeddings
          </TabsTrigger>
          <TabsTrigger value="security">
            <LockIcon className="size-4" />
            Beveiliging
          </TabsTrigger>
        </TabsList>

        {activeTab === "general" && (
          <Button
            size="sm"
            onClick={handleSaveSettings}
            disabled={settingsSaving || !settingsHasChanges}
          >
            {settingsSaving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            Bewaren
          </Button>
        )}
      </header>

      <TabsContent value="general">
        <SettingsPanel
          onHasChangesChange={setSettingsHasChanges}
          triggerSave={triggerSettingsSave}
          onSaveComplete={handleSettingsSaveComplete}
        />
      </TabsContent>

      <TabsContent value="embeddings">
        <DocumentEmbeddings />
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>
    </Tabs>
  );
}
