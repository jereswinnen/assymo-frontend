"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/admin/ConversationList";
import { ConversationDialog } from "@/components/admin/ConversationDialog";
import { DocumentEmbeddings } from "@/components/admin/DocumentEmbeddings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Conversation } from "@/components/admin/ConversationList";
import { MessagesSquareIcon, ScanTextIcon } from "lucide-react";

export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/admin/conversations");

      // If unauthorized, redirect to login
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="conversations" className="w-full">
        <TabsList>
          <TabsTrigger value="conversations">
            <MessagesSquareIcon />
            Conversaties
          </TabsTrigger>
          <TabsTrigger value="embeddings">
            <ScanTextIcon />
            Embeddings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          <ConversationList
            conversations={conversations}
            onConversationClick={handleConversationClick}
          />
        </TabsContent>

        <TabsContent value="embeddings">
          <DocumentEmbeddings />
        </TabsContent>
      </Tabs>

      <ConversationDialog
        conversation={selectedConversation}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
