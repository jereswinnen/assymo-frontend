"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
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
import { AppointmentsList } from "@/components/admin/appointments/AppointmentsList";
import { OpeningHours } from "@/components/admin/appointments/OpeningHours";
import { DateOverrides } from "@/components/admin/appointments/DateOverrides";
import { t } from "@/config/strings";

export default function AppointmentsPage() {
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

  // Header actions based on active tab
  const headerActions = useMemo(() => {
    if (activeTab === "overview") {
      return (
        <Button size="sm" onClick={() => setCreateAppointmentOpen(true)}>
          <CalendarPlusIcon className="size-4" />
          {t("admin.headings.newAppointment")}
        </Button>
      );
    }

    if (activeTab === "opening-hours") {
      return (
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
          {t("admin.buttons.save")}
        </Button>
      );
    }

    if (activeTab === "overrides") {
      return (
        <Button size="sm" onClick={() => setCreateOverrideOpen(true)}>
          <ClockPlusIcon className="size-4" />
          {t("admin.buttons.add")}
        </Button>
      );
    }

    return null;
  }, [activeTab, settingsSaving, settingsHasChanges]);

  useAdminHeaderActions(headerActions);

  if (!mounted) {
    return null;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="overview">
          <ListTreeIcon className="size-4" />
          {t("admin.headings.overview")}
        </TabsTrigger>
        <TabsTrigger value="opening-hours">
          <ClockIcon className="size-4" />
          {t("admin.headings.openingHours")}
        </TabsTrigger>
        <TabsTrigger value="overrides">
          <SquareDashedMousePointerIcon className="size-4" />
          {t("admin.headings.exceptions")}
        </TabsTrigger>
      </TabsList>

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
