"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarPlusIcon,
  CheckIcon,
  ClockIcon,
  ClockPlusIcon,
  ListTreeIcon,
  Loader2Icon,
  SquareDashedMousePointerIcon,
} from "lucide-react";
import { AppointmentsList } from "./AppointmentsList";
import { OpeningHours } from "./OpeningHours";
import { DateOverrides } from "./DateOverrides";

export function AppointmentsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lifted state for AppointmentsList
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);

  // Lifted state for AppointmentSettings
  const [settingsHasChanges, setSettingsHasChanges] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [triggerSettingsSave, setTriggerSettingsSave] = useState(0);

  // Lifted state for DateOverrides
  const [createOverrideOpen, setCreateOverrideOpen] = useState(false);

  const handleSaveSettings = () => {
    setSettingsSaving(true);
    setTriggerSettingsSave((n) => n + 1);
  };

  const handleSettingsSaveComplete = () => {
    setSettingsSaving(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4"
    >
      <header className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="overview">
            <ListTreeIcon className="size-4" />
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="opening-hours">
            <ClockIcon className="size-4" />
            Openingsuren
          </TabsTrigger>
          <TabsTrigger value="overrides">
            <SquareDashedMousePointerIcon className="size-4" />
            Uitzonderingen
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {activeTab === "overview" && (
            <Button onClick={() => setCreateAppointmentOpen(true)}>
              <CalendarPlusIcon className="size-4" />
              Nieuwe afspraak
            </Button>
          )}

          {activeTab === "opening-hours" && (
            <Button
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

          {activeTab === "overrides" && (
            <Button onClick={() => setCreateOverrideOpen(true)}>
              <ClockPlusIcon className="size-4" />
              Toevoegen
            </Button>
          )}
        </div>
      </header>

      <TabsContent value="overview">
        <AppointmentsList
          createDialogOpen={createAppointmentOpen}
          onCreateDialogOpenChange={setCreateAppointmentOpen}
        />
      </TabsContent>

      <TabsContent value="opening-hours">
        <OpeningHours
          onHasChangesChange={setSettingsHasChanges}
          triggerSave={triggerSettingsSave}
          onSaveComplete={handleSettingsSaveComplete}
        />
      </TabsContent>

      <TabsContent value="overrides">
        <DateOverrides
          createDialogOpen={createOverrideOpen}
          onCreateDialogOpenChange={setCreateOverrideOpen}
        />
      </TabsContent>
    </Tabs>
  );
}
