"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/admin/ConversationList";
import { ConversationDialog } from "@/components/admin/ConversationDialog";
import { DocumentEmbeddings } from "@/components/admin/DocumentEmbeddings";
import type { Conversation } from "@/components/admin/ConversationList";

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
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversationList
            conversations={conversations}
            onConversationClick={handleConversationClick}
          />
          <DocumentEmbeddings />
        </div>
      </div>

      <ConversationDialog
        conversation={selectedConversation}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
