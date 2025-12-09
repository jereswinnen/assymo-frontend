"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { DocumentEmbeddings } from "@/components/admin/DocumentEmbeddings";

export default function SettingsPage() {
  return (
    <Tabs defaultValue="general" className="space-y-4" id="settings-tabs">
      <TabsList>
        <TabsTrigger value="general">Algemeen</TabsTrigger>
        <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <SettingsPanel />
      </TabsContent>

      <TabsContent value="embeddings">
        <DocumentEmbeddings />
      </TabsContent>
    </Tabs>
  );
}
