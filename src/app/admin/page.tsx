"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/admin/ConversationList";
import { ConversationDialog } from "@/components/admin/ConversationDialog";
import { DocumentEmbeddings } from "@/components/admin/DocumentEmbeddings";
import { EmailDashboard } from "@/components/admin/EmailDashboard";
import { AppointmentsDashboard } from "@/components/admin/AppointmentsDashboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import type { Conversation } from "@/components/admin/ConversationList";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { MessagesSquareIcon, ScanTextIcon, MailIcon, CalendarDaysIcon, SettingsIcon } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList>
          <TabsTrigger value="appointments">
            <CalendarDaysIcon />
            Afspraken
          </TabsTrigger>
          <TabsTrigger value="emails">
            <MailIcon />
            E-mails
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessagesSquareIcon />
            Conversaties
          </TabsTrigger>
          <TabsTrigger value="embeddings">
            <ScanTextIcon />
            Embeddings
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon />
            Instellingen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <AppointmentsDashboard />
        </TabsContent>

        <TabsContent value="emails">
          <EmailDashboard />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationList
            conversations={conversations}
            onConversationClick={handleConversationClick}
          />
        </TabsContent>

        <TabsContent value="embeddings">
          <DocumentEmbeddings />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel />
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
