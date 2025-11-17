"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Conversation } from "./ConversationList";
import {
  ClockIcon,
  MessageSquareIcon,
  ActivityIcon,
  GlobeIcon,
} from "lucide-react";

type ConversationDialogProps = {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConversationDialog({
  conversation,
  open,
  onOpenChange,
}: ConversationDialogProps) {
  if (!conversation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Conversation {conversation.session_id.substring(0, 12)}...
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            View detailed conversation history and metadata
          </DialogDescription>
        </DialogHeader>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Messages:</span>
            <span className="text-foreground font-semibold">
              {conversation.message_count}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GlobeIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">IP:</span>
            <span className="text-foreground font-mono text-xs font-semibold">
              {conversation.ip_address}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Avg Response:</span>
            <span className="text-foreground font-semibold">
              {conversation.avg_response_time}ms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Started:</span>
            <span className="text-foreground">
              {new Date(conversation.started_at).toLocaleString()}
            </span>
          </div>
        </div>

        <Separator />

        {/* Messages */}
        <div className="space-y-4">
          {conversation.messages.map((msg, idx) => (
            <Card key={msg.id}>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">
                    Message {idx + 1}
                  </span>
                  <span>•</span>
                  <ClockIcon className="size-3" />
                  <span>{new Date(msg.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <ActivityIcon className="size-3" />
                  <span>{msg.response_time_ms}ms</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs font-semibold mb-2">User</div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    {msg.user_message}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-2">Bot</div>
                  <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {msg.bot_response}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
