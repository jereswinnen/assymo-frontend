"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { toast } from "sonner";
import {
  AlertCircleIcon,
  BotMessageSquareIcon,
  CheckIcon,
  CloudUploadIcon,
  Loader2Icon,
  ScanTextIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react";
import { getTestEmail, setTestEmail } from "@/lib/adminSettings";
import { DEFAULT_TEST_EMAIL } from "@/config/resend";
import type { DocumentInfo } from "@/types/chat";
import { t } from "@/config/strings";

export default function SettingsPage() {
  // General settings
  const [testEmailValue, setTestEmailValue] = useState(DEFAULT_TEST_EMAIL);
  const [originalEmail, setOriginalEmail] = useState(DEFAULT_TEST_EMAIL);
  const [savingEmail, setSavingEmail] = useState(false);

  // Document embeddings
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(true);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<string[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] =
    useState(false);
  const [deletingDocument, setDeletingDocument] = useState(false);

  const hasEmailChanges = testEmailValue !== originalEmail;

  // Load all data on mount
  useEffect(() => {
    // Load test email
    const saved = getTestEmail();
    setTestEmailValue(saved);
    setOriginalEmail(saved);

    // Load document info
    loadDocumentInfo();
  }, []);

  // === Email handlers ===
  const handleSaveEmail = useCallback(async () => {
    const trimmed = testEmailValue.trim();
    if (!trimmed) {
      toast.error(t("admin.messages.emailRequired"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error(t("admin.messages.emailInvalid"));
      return;
    }

    setSavingEmail(true);
    setTestEmail(trimmed);
    setTestEmailValue(trimmed);
    setOriginalEmail(trimmed);
    toast.success(t("admin.messages.settingsSaved"));
    setSavingEmail(false);
  }, [testEmailValue]);

  // === Document handlers ===
  const loadDocumentInfo = async () => {
    setLoadingDocument(true);
    try {
      const response = await fetch("/api/admin/document-info");
      if (response.status === 401) {
        setLoadingDocument(false);
        return;
      }
      if (!response.ok) throw new Error("Failed to load document info");

      const data = await response.json();
      if (data.document) {
        setDocumentInfo({
          ...data.document,
          uploadedAt: new Date(data.document.uploadedAt),
        });
      } else {
        setDocumentInfo(null);
      }
    } catch (error) {
      console.error("Failed to load document info:", error);
      toast.error(t("admin.messages.documentInfoLoadFailed"));
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith(".md")) {
        toast.error(t("admin.messages.selectMarkdown"));
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t("admin.messages.selectDocument"));
      return;
    }

    setUploading(true);
    setTestResults(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/admin/document-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("admin.messages.uploadFailed"));

      toast.success(
        `Document succesvol verwerkt: ${data.chunkCount} chunks aangemaakt`,
      );
      await loadDocumentInfo();
      setFile(null);
      const fileInput = document.getElementById(
        "document-file",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : t("admin.messages.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    setDeletingDocument(true);
    try {
      const response = await fetch("/api/admin/document-upload", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete mislukt");

      toast.success(t("admin.messages.documentDeleted"));
      await loadDocumentInfo();
      setTestResults(null);
      setDeleteDocumentDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("admin.messages.deleteFailed"));
    } finally {
      setDeletingDocument(false);
    }
  };

  const handleTestRetrieval = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim()) {
      toast.error(t("admin.messages.enterTestQuery"));
      return;
    }

    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch("/api/admin/test-retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Test mislukt");

      setTestResults(data.chunks);
      if (data.chunks.length === 0) {
        toast.warning(t("admin.messages.searchFailed"));
      } else {
        toast.success(`${data.chunks.length} relevante chunks gevonden`);
      }
    } catch (error) {
      console.error("Test retrieval error:", error);
      toast.error(error instanceof Error ? error.message : t("admin.messages.searchFailed"));
    } finally {
      setTesting(false);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button
        size="sm"
        onClick={handleSaveEmail}
        disabled={savingEmail || !hasEmailChanges}
      >
        {savingEmail ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        {t("admin.buttons.save")}
      </Button>
    ),
    [savingEmail, hasEmailChanges, handleSaveEmail],
  );
  useAdminHeaderActions(headerActions);

  if (loadingDocument) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FieldGroup className="max-w-2xl">
      {/* Algemeen */}
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <Settings2Icon className="size-4 opacity-80" />
          {t("admin.misc.general")}
        </FieldLegend>
        <Field>
          <FieldLabel htmlFor="testEmail">{t("admin.misc.testEmail")}</FieldLabel>
          <Input
            id="testEmail"
            type="email"
            value={testEmailValue}
            onChange={(e) => setTestEmailValue(e.target.value)}
            placeholder={DEFAULT_TEST_EMAIL}
          />
          <FieldDescription>
            {t("admin.misc.testEmailDesc")}
          </FieldDescription>
        </Field>
      </FieldSet>

      <Separator />

      {/* Embeddings */}
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <ScanTextIcon className="size-4 opacity-80" />
          Embeddings
        </FieldLegend>

        {documentInfo ? (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <div className="text-base font-medium">
                {documentInfo.documentName}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {documentInfo.chunkCount} chunks
                </Badge>
                <Badge variant="secondary">
                  {documentInfo.totalCharacters.toLocaleString()} {t("admin.misc.characters")}
                </Badge>
                <Badge variant="outline">
                  {new Date(documentInfo.uploadedAt).toLocaleDateString(
                    "nl-NL",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDocumentDialogOpen(true)}
            >
              <Trash2Icon className="size-4" />
              {t("admin.buttons.delete")}
            </Button>
          </div>
        ) : (
          <Alert>
            <AlertCircleIcon className="size-4" />
            <AlertDescription>
              {t("admin.misc.noDocumentUploaded")}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            id="document-file"
            type="file"
            accept=".md"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {file && (
            <div className="text-sm text-muted-foreground">
              {t("admin.misc.selected")}: <span className="font-medium">{file.name}</span> (
              {(file.size / 1024).toFixed(0)} KB)
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-fit"
          >
            {uploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("admin.misc.processing")}
              </>
            ) : (
              <>
                <CloudUploadIcon className="size-4" />
                {t("admin.misc.uploading")}
              </>
            )}
          </Button>
        </div>

        <Separator />

        <Field>
          <FieldLabel htmlFor="test-query">{t("admin.misc.testRetrieval")}</FieldLabel>
          <Textarea
            id="test-query"
            placeholder={t("admin.placeholders.testQuery")}
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            disabled={testing || !documentInfo}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTestRetrieval();
              }
            }}
          />
          <FieldDescription>
            {t("admin.misc.testRetrievalDesc")}
          </FieldDescription>
        </Field>

        <Button
          onClick={handleTestRetrieval}
          disabled={!testQuery.trim() || testing || !documentInfo}
          variant="secondary"
          className="w-fit"
        >
          {testing ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {t("admin.misc.searching")}
            </>
          ) : (
            <>
              <BotMessageSquareIcon className="size-4" />
              {t("admin.buttons.send")}
            </>
          )}
        </Button>

        {testResults && testResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {t("admin.misc.foundChunks")} ({testResults.length}):
            </p>
            {testResults.map((chunk, index) => (
              <div
                key={index}
                className="p-3 bg-muted rounded-lg text-sm space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t("admin.misc.chunk")} {index + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {chunk.length} {t("admin.misc.characters")}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{chunk}</p>
              </div>
            ))}
          </div>
        )}

        {testResults && testResults.length === 0 && (
          <Alert>
            <AlertCircleIcon className="size-4" />
            <AlertDescription>
              {t("admin.misc.noRelevantChunks")}
            </AlertDescription>
          </Alert>
        )}
      </FieldSet>

      {/* Delete Document Dialog */}
      <Dialog
        open={deleteDocumentDialogOpen}
        onOpenChange={setDeleteDocumentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.headings.deleteDocument")}</DialogTitle>
            <DialogDescription>
              {t("admin.misc.deleteDocumentDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDocumentDialogOpen(false)}
              disabled={deletingDocument}
            >
              {t("admin.buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={deletingDocument}
            >
              {deletingDocument ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.buttons.deleting")}
                </>
              ) : (
                <>
                  <Trash2Icon className="size-4" />
                  {t("admin.buttons.delete")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FieldGroup>
  );
}
