"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSelect } from "@/components/admin/IconSelect";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { PageHeaderSection } from "@/types/sections";
import { Separator } from "@/components/ui/separator";
import { useSiteContext } from "@/lib/permissions/site-context";
import { t } from "@/config/strings";

interface ButtonItem {
  _key: string;
  label: string;
  action?: "link" | "openChatbot" | "openConfigurator";
  url?: string;
  icon?: string;
  variant?: "primary" | "secondary";
}

interface PageHeaderFormProps {
  section: PageHeaderSection;
  onChange: (section: PageHeaderSection) => void;
}

export function PageHeaderForm({ section, onChange }: PageHeaderFormProps) {
  const { currentSite } = useSiteContext();
  const buttons = section.buttons || [];

  const addButton = () => {
    if (buttons.length >= 2) return;
    const newButton: ButtonItem = {
      _key: crypto.randomUUID(),
      label: "",
      url: "",
      variant: "primary",
    };
    onChange({ ...section, buttons: [...buttons, newButton] });
  };

  const updateButton = (index: number, updates: Partial<ButtonItem>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    onChange({ ...section, buttons: newButtons });
  };

  const removeButton = (index: number) => {
    onChange({ ...section, buttons: buttons.filter((_, i) => i !== index) });
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="title">{t("admin.labels.title")}</FieldLabel>
        <Input
          id="title"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder={t("admin.placeholders.pageTitle")}
        />
      </Field>

      <RichTextEditor
        label={t("admin.labels.subtitle")}
        value={section.subtitle || ""}
        onChange={(value) => onChange({ ...section, subtitle: value })}
      />

      <Separator />

      <div className="space-y-4">
        <Field orientation="horizontal">
          <FieldLabel htmlFor="background">{t("admin.labels.showBackground")}</FieldLabel>
          <Switch
            id="background"
            checked={section.background || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, background: checked })
            }
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="showImage">{t("admin.labels.showImage")}</FieldLabel>
          <Switch
            id="showImage"
            checked={section.showImage || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showImage: checked })
            }
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="showButtons">{t("admin.labels.showButtons")}</FieldLabel>
          <Switch
            id="showButtons"
            checked={section.showButtons || false}
            onCheckedChange={(checked) =>
              onChange({ ...section, showButtons: checked })
            }
          />
        </Field>
      </div>

      <Separator />

      {section.showButtons && (
        <div className="space-y-4">
          <header className="flex items-center justify-between">
            <FieldLabel>{t("admin.labels.actions")}</FieldLabel>
            {buttons.length < 2 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addButton}
              >
                <PlusIcon className="size-4" />
                {t("admin.buttons.addButton")}
              </Button>
            )}
          </header>

          {buttons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              {t("admin.empty.noButtons")}
            </p>
          ) : (
            <div className="space-y-6">
              {buttons.map((button, index) => (
                <div
                  key={button._key}
                  className="p-4 space-y-4 border rounded-lg"
                >
                  <Field>
                    <FieldLabel>{t("admin.labels.action")}</FieldLabel>
                    <Select
                      value={button.action || "link"}
                      onValueChange={(value) =>
                        updateButton(index, {
                          action: value as "link" | "openChatbot" | "openConfigurator",
                          url: value !== "link" ? undefined : button.url,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="openChatbot">{t("admin.labels.openChatbot")}</SelectItem>
                        <SelectItem value="openConfigurator">{t("admin.labels.openConfigurator")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>{t("admin.labels.label")}</FieldLabel>
                      <Input
                        value={button.label || ""}
                        onChange={(e) =>
                          updateButton(index, { label: e.target.value })
                        }
                        placeholder={
                          button.action === "openChatbot"
                            ? t("admin.placeholders.askQuestion")
                            : button.action === "openConfigurator"
                              ? "Start configurator"
                              : t("admin.placeholders.buttonText")
                        }
                      />
                    </Field>
                    {button.action === "link" && (
                      <Field>
                        <FieldLabel>{t("admin.labels.url")}</FieldLabel>
                        <Input
                          value={button.url || ""}
                          onChange={(e) =>
                            updateButton(index, { url: e.target.value })
                          }
                          placeholder="/contact"
                        />
                        <FieldDescription>
                          {currentSite?.domain || "https://..."}
                          {button.url || "/..."}
                        </FieldDescription>
                      </Field>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>{t("admin.labels.icon")}</FieldLabel>
                      <IconSelect
                        value={button.icon || ""}
                        onValueChange={(value) =>
                          updateButton(index, { icon: value || undefined })
                        }
                        allowNone
                      />
                    </Field>
                    <Field>
                      <FieldLabel>{t("admin.labels.variant")}</FieldLabel>
                      <Select
                        value={button.variant || "primary"}
                        onValueChange={(value) =>
                          updateButton(index, {
                            variant: value as "primary" | "secondary",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">
                            {t("admin.misc.primary")}
                          </SelectItem>
                          <SelectItem value="secondary">
                            {t("admin.misc.secondary")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Button
                    className="text-destructive"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeButton(index)}
                  >
                    <Trash2Icon className="size-4" />
                    {t("admin.buttons.removeButton")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </FieldGroup>
  );
}
