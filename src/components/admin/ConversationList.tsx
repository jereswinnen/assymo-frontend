"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
} from "@/components/ui/item";
import { MessageSquareIcon } from "lucide-react";

export type Message = {
  id: number;
  user_message: string;
  bot_response: string;
  response_time_ms: number;
  created_at: string;
};

export type Conversation = {
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  ip_address: string;
  avg_response_time: number;
  messages: Message[];
};

type ConversationListProps = {
  conversations: Conversation[];
  onConversationClick: (conversation: Conversation) => void;
};

export function ConversationList({
  conversations,
  onConversationClick,
}: ConversationListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareIcon className="size-5" />
          Conversations ({conversations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {conversations.length === 0 ? (
          <div className="text-muted-foreground text-center text-sm py-8">
            No conversations yet
          </div>
        ) : (
          <ItemGroup className="max-h-full overflow-y-auto space-y-1">
            {conversations.map((conv) => (
              <Item
                key={conv.session_id}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onConversationClick(conv)}
              >
                <ItemMedia variant="icon">
                  <MessageSquareIcon className="size-4" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    Session {conv.session_id.substring(0, 8)}...
                  </ItemTitle>
                  <ItemDescription>
                    {conv.message_count} message
                    {conv.message_count !== 1 ? "s" : ""} •
                    {new Date(conv.last_message_at).toLocaleDateString()} at{" "}
                    {new Date(conv.last_message_at).toLocaleTimeString()}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}
