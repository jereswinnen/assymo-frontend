"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/admin/ConversationList";
import { ConversationDialog } from "@/components/admin/ConversationDialog";
import { Spinner } from "@/components/ui/spinner";
import type { Conversation } from "@/components/admin/ConversationList";

function ConversationsContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSessionId = searchParams.get("conversation");
  const selectedConversation = conversations.find(
    (c) => c.session_id === selectedSessionId
  );

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/admin/conversations");

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
    router.push(`/admin/conversations?conversation=${conversation.session_id}`);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      router.push("/admin/conversations");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <>
      <ConversationList
        conversations={conversations}
        onConversationClick={handleConversationClick}
      />

      <ConversationDialog
        conversation={selectedConversation ?? null}
        open={!!selectedConversation}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="size-8" />
        </div>
      }
    >
      <ConversationsContent />
    </Suspense>
  );
}
