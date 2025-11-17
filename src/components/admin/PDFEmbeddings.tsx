"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileTextIcon } from "lucide-react";

export function PDFEmbeddings() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="size-5" />
          PDF Embeddings
        </CardTitle>
        <CardDescription>
          Manage PDF documents and embeddings for the chatbot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-center text-sm py-8 border-2 border-dashed rounded-lg">
          Placeholder...^
        </div>
      </CardContent>
    </Card>
  );
}
