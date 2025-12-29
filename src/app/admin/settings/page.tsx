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
      toast.error("Vul een e-mailadres in");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Vul een geldig e-mailadres in");
      return;
    }

    setSavingEmail(true);
    setTestEmail(trimmed);
    setTestEmailValue(trimmed);
    setOriginalEmail(trimmed);
    toast.success("Instellingen opgeslagen");
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
      toast.error("Kon documentinformatie niet laden");
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith(".md")) {
        toast.error("Selecteer een Markdown (.md) bestand");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecteer eerst een document");
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
      if (!response.ok) throw new Error(data.error || "Upload mislukt");

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
      toast.error(error instanceof Error ? error.message : "Upload mislukt");
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

      toast.success("Document verwijderd");
      await loadDocumentInfo();
      setTestResults(null);
      setDeleteDocumentDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Verwijderen mislukt");
    } finally {
      setDeletingDocument(false);
    }
  };

  const handleTestRetrieval = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim()) {
      toast.error("Voer een test query in");
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
        toast.warning("Geen relevante chunks gevonden");
      } else {
        toast.success(`${data.chunks.length} relevante chunks gevonden`);
      }
    } catch (error) {
      console.error("Test retrieval error:", error);
      toast.error(error instanceof Error ? error.message : "Test mislukt");
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
        Opslaan
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
          Algemeen
        </FieldLegend>
        <Field>
          <FieldLabel htmlFor="testEmail">Test e-mailadres</FieldLabel>
          <Input
            id="testEmail"
            type="email"
            value={testEmailValue}
            onChange={(e) => setTestEmailValue(e.target.value)}
            placeholder={DEFAULT_TEST_EMAIL}
          />
          <FieldDescription>
            Dit e-mailadres wordt gebruikt voor nieuwsbrief tests
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
                  {documentInfo.totalCharacters.toLocaleString()} tekens
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
              Verwijderen
            </Button>
          </div>
        ) : (
          <Alert>
            <AlertCircleIcon className="size-4" />
            <AlertDescription>
              Geen document geüpload. Upload een Markdown bestand om te
              beginnen.
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
              Geselecteerd: <span className="font-medium">{file.name}</span> (
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
                Verwerken...
              </>
            ) : (
              <>
                <CloudUploadIcon className="size-4" />
                Uploaden
              </>
            )}
          </Button>
        </div>

        <Separator />

        <Field>
          <FieldLabel htmlFor="test-query">Test retrieval</FieldLabel>
          <Textarea
            id="test-query"
            placeholder="bijv. Wat zijn jullie openingstijden?"
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
            Test de vector search met een voorbeeldvraag
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
              Zoeken...
            </>
          ) : (
            <>
              <BotMessageSquareIcon className="size-4" />
              Versturen
            </>
          )}
        </Button>

        {testResults && testResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Gevonden chunks ({testResults.length}):
            </p>
            {testResults.map((chunk, index) => (
              <div
                key={index}
                className="p-3 bg-muted rounded-lg text-sm space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Chunk {index + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {chunk.length} tekens
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
              Geen relevante chunks gevonden voor deze query.
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
            <DialogTitle>Document verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je het huidige document wilt verwijderen? Deze
              actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDocumentDialogOpen(false)}
              disabled={deletingDocument}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={deletingDocument}
            >
              {deletingDocument ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                <>
                  <Trash2Icon className="size-4" />
                  Verwijderen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FieldGroup>
  );
}
