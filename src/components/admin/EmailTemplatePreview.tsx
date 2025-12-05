"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2Icon,
  MailIcon,
  MailSearchIcon,
  MaximizeIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
}

export function EmailTemplatePreview() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadPreview(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-preview");
      if (!response.ok) throw new Error("Failed to load templates");
      const data = await response.json();
      setTemplates(data.templates || []);
      // Select first template by default
      if (data.templates?.length > 0) {
        setSelectedTemplate(data.templates[0].id);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadPreview = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/email-preview?template=${templateId}`,
      );
      if (!response.ok) throw new Error("Failed to load preview");
      const data = await response.json();
      setHtml(data.html || "");
    } catch (error) {
      console.error("Failed to load preview:", error);
      setHtml("");
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailSearchIcon className="size-4 text-muted-foreground" />
            <h3 className="mb-0! text-base font-semibold">
              E-mail template preview
            </h3>
          </div>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecteer een template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative rounded-lg border bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : html ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => setFullscreen(true)}
              >
                <MaximizeIcon className="size-4" />
              </Button>
              <iframe
                srcDoc={html}
                className="h-[500px] w-full rounded-lg bg-white"
                title="Email preview"
              />
            </>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Selecteer een template om de preview te bekijken
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative h-[90vh] w-[90vw] max-w-4xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-12 top-0 text-white hover:bg-white/20"
              onClick={() => setFullscreen(false)}
            >
              <XIcon className="size-6" />
            </Button>
            <iframe
              srcDoc={html}
              className="size-full rounded-lg bg-white"
              title="Email preview fullscreen"
            />
          </div>
        </div>
      )}
    </>
  );
}
