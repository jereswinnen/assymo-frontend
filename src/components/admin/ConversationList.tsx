"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  if (conversations.length === 0) {
    return (
      <div className="text-muted-foreground text-center text-sm py-8">
        Nog geen conversaties
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Berichten</TableHead>
          <TableHead>Laatste activiteit</TableHead>
          <TableHead>Gem. responstijd</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conversations.map((conv) => (
          <TableRow
            key={conv.session_id}
            className="cursor-pointer"
            onClick={() => onConversationClick(conv)}
          >
            <TableCell className="font-mono text-sm">
              {conv.session_id.substring(0, 8)}...
            </TableCell>
            <TableCell>{conv.message_count}</TableCell>
            <TableCell>
              {new Date(conv.last_message_at).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
            <TableCell>{Math.round(conv.avg_response_time)}ms</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
