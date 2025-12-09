"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "./ConversationList";

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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-medium">
              Conversatie
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {conversation.session_id.substring(0, 8)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {conversation.message_count} berichten
              </Badge>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatDate(conversation.started_at)} &middot; IP:{" "}
            {conversation.ip_address} &middot; Gem. responstijd:{" "}
            {Math.round(conversation.avg_response_time)}ms
          </div>
        </DialogHeader>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {conversation.messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] space-y-1">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 text-sm">
                    {msg.user_message}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right pr-1">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>

              {/* Bot response */}
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-1">
                  <div
                    className={cn(
                      "bg-muted rounded-2xl rounded-bl-md px-4 py-2 text-sm whitespace-pre-wrap"
                    )}
                  >
                    {msg.bot_response}
                  </div>
                  <div className="text-[10px] text-muted-foreground pl-1">
                    {msg.response_time_ms}ms
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
