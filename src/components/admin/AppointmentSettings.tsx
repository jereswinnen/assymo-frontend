"use client";

import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentSettings as SettingsType } from "@/types/appointments";
import { DAYS_OF_WEEK } from "@/types/appointments";

interface DaySettingRow {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
}

interface AppointmentSettingsProps {
  onHasChangesChange: (hasChanges: boolean) => void;
  triggerSave: number;
  onSaveComplete: () => void;
}

export function AppointmentSettings({
  onHasChangesChange,
  triggerSave,
  onSaveComplete,
}: AppointmentSettingsProps) {
  const [settings, setSettings] = useState<DaySettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const originalSettings = useRef<DaySettingRow[]>([]);

  // Notify parent of hasChanges
  useEffect(() => {
    onHasChangesChange(hasChanges);
  }, [hasChanges, onHasChangesChange]);

  // Respond to save trigger from parent
  useEffect(() => {
    if (triggerSave > 0) {
      handleSave();
    }
  }, [triggerSave]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/appointments/settings");
      if (!response.ok) throw new Error("Failed to load settings");

      const data = await response.json();

      // Transform to editable format
      const rows: DaySettingRow[] = DAYS_OF_WEEK.map((day) => {
        const existing = data.settings?.find(
          (s: SettingsType) => s.day_of_week === day.value,
        );
        return {
          day_of_week: day.value,
          is_open: existing?.is_open ?? false,
          open_time: existing?.open_time?.substring(0, 5) || "10:00",
          close_time: existing?.close_time?.substring(0, 5) || "17:00",
          slot_duration_minutes: existing?.slot_duration_minutes ?? 60,
        };
      });

      setSettings(rows);
      originalSettings.current = JSON.parse(JSON.stringify(rows));
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Kon instellingen niet laden");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (
    dayOfWeek: number,
    field: keyof DaySettingRow,
    value: boolean | string | number,
  ) => {
    setSettings((prev) => {
      const updated = prev.map((s) =>
        s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s,
      );
      // Check if settings differ from original
      setHasChanges(
        JSON.stringify(updated) !== JSON.stringify(originalSettings.current),
      );
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/appointments/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: settings.map((s) => ({
            day_of_week: s.day_of_week,
            is_open: s.is_open,
            open_time: s.is_open ? s.open_time : null,
            close_time: s.is_open ? s.close_time : null,
            slot_duration_minutes: s.slot_duration_minutes,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Instellingen opgeslagen");
      originalSettings.current = JSON.parse(JSON.stringify(settings));
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Kon instellingen niet opslaan",
      );
    } finally {
      onSaveComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {settings.map((setting) => {
          const dayInfo = DAYS_OF_WEEK[setting.day_of_week];

          return (
            <div
              key={setting.day_of_week}
              className="flex items-center gap-4 p-3 border rounded-lg"
            >
              {/* Day checkbox */}
              <div className="flex items-center gap-2 w-32">
                <Checkbox
                  id={`day-${setting.day_of_week}`}
                  checked={setting.is_open}
                  onCheckedChange={(checked) =>
                    updateSetting(setting.day_of_week, "is_open", !!checked)
                  }
                />
                <Label
                  htmlFor={`day-${setting.day_of_week}`}
                  className={!setting.is_open ? "text-muted-foreground" : ""}
                >
                  {dayInfo.name}
                </Label>
              </div>

              {/* Times */}
              {setting.is_open ? (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Van</Label>
                    <Input
                      type="time"
                      value={setting.open_time}
                      onChange={(e) =>
                        updateSetting(
                          setting.day_of_week,
                          "open_time",
                          e.target.value,
                        )
                      }
                      className="w-28 [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Tot</Label>
                    <Input
                      type="time"
                      value={setting.close_time}
                      onChange={(e) =>
                        updateSetting(
                          setting.day_of_week,
                          "close_time",
                          e.target.value,
                        )
                      }
                      className="w-28 [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Slot (min)
                    </Label>
                    <Input
                      type="number"
                      min={15}
                      max={480}
                      step={15}
                      value={setting.slot_duration_minutes}
                      onChange={(e) =>
                        updateSetting(
                          setting.day_of_week,
                          "slot_duration_minutes",
                          parseInt(e.target.value) || 60,
                        )
                      }
                      className="w-20"
                    />
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Gesloten</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
