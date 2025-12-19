"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
  Trash2Icon,
  BotMessageSquareIcon,
  CloudUploadIcon,
  UploadCloudIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentInfo } from "@/types/chat";

export function DocumentEmbeddings() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<string[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load document info on mount
  useEffect(() => {
    loadDocumentInfo();
  }, []);

  const loadDocumentInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/document-info");

      // Silently handle 401 - user will be redirected by admin page
      if (response.status === 401) {
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load document info");
      }

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
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const isValid = fileName.endsWith(".md");

      if (!isValid) {
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
    setTestResults(null); // Clear previous test results

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/admin/document-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload mislukt");
      }

      toast.success(
        `Document succesvol verwerkt: ${data.chunkCount} chunks aangemaakt`,
      );

      // Reload document info
      await loadDocumentInfo();

      // Clear file input
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/admin/document-upload", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete mislukt");
      }

      toast.success("Document verwijderd");
      await loadDocumentInfo();
      setTestResults(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Verwijderen mislukt");
    } finally {
      setDeleting(false);
    }
  };

  const handleTestRetrieval = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!testQuery.trim()) {
      toast.error("Voer een test query in");
      return;
    }

    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch("/api/admin/test-retrieval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: testQuery.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Test mislukt");
      }

      console.log("🔍 Test retrieval response:", data);
      console.log("📦 Chunks received:", data.chunks);
      console.log("🔢 Chunk count:", data.chunks?.length);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Document Status */}
      {documentInfo ? (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 border rounded-md bg-muted">
              <FileTextIcon className="size-5" />
            </div>
            <div>
              <div className="font-medium">{documentInfo.documentName}</div>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary">
                  {documentInfo.chunkCount} chunks
                </Badge>
                <Badge variant="secondary">
                  {documentInfo.totalCharacters.toLocaleString()} tekens
                </Badge>
                <Badge variant="outline">
                  {new Date(documentInfo.uploadedAt).toLocaleDateString(
                    "nl-NL",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <Button size="sm" variant="destructive" onClick={handleDeleteClick}>
            <Trash2Icon className="size-4" />
            Verwijder
          </Button>
        </div>
      ) : (
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertDescription>
            Geen document geüpload. Upload een Markdown bestand om te beginnen.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
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

      <Separator />

      {/* Upload Section */}
      <div className="space-y-4">
        <header className="space-y-2">
          <h3 className="mb-1! font-medium flex items-center gap-1.5">
            <UploadCloudIcon className="size-5" />
            Upload document
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload een Markdown document (vervangt het huidige document)
          </p>
        </header>

        <div className="space-y-3">
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
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Verwerken...
              </>
            ) : (
              <>
                <CloudUploadIcon className="size-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Test Retrieval Section */}
      <div className="space-y-4">
        <header className="space-y-2">
          <h3 className="mb-1! font-medium flex items-center gap-1.5">
            <BotMessageSquareIcon className="size-5" />
            Test retrieval
          </h3>
          <p className="text-sm text-muted-foreground">
            Test de vector search met een voorbeeldvraag
          </p>
        </header>

        <form onSubmit={handleTestRetrieval} className="space-y-3">
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

          <Button
            type="submit"
            disabled={!testQuery.trim() || testing || !documentInfo}
            variant="secondary"
            className="w-full"
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
        </form>

        {/* Test Results */}
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
      </div>
    </div>
  );
}
