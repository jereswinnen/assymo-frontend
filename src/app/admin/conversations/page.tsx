"use client";

import { useEffect, useState } from "react";

type Message = {
  id: number;
  user_message: string;
  bot_response: string;
  response_time_ms: number;
  created_at: string;
};

type Conversation = {
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  ip_address: string;
  avg_response_time: number;
  messages: Message[];
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/admin/conversations", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
        },
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConversation = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Conversation Threads</h1>

      <div className="mb-4 text-sm text-gray-600">
        Total conversations: {conversations.length}
      </div>

      <div className="space-y-4">
        {conversations.map((conv) => {
          const isExpanded = expandedSessions.has(conv.session_id);

          return (
            <div
              key={conv.session_id}
              className="border rounded-lg bg-white shadow"
            >
              {/* Conversation Header */}
              <button
                onClick={() => toggleConversation(conv.session_id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg mb-1">
                      Session: {conv.session_id.substring(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-600">
                      {conv.message_count} message
                      {conv.message_count !== 1 ? "s" : ""} • IP:{" "}
                      {conv.ip_address} • Avg response: {conv.avg_response_time}
                      ms
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>
                      Started: {new Date(conv.started_at).toLocaleString()}
                    </div>
                    <div>
                      Last: {new Date(conv.last_message_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Messages */}
              {isExpanded && (
                <div className="border-t p-4 bg-gray-50 space-y-4">
                  {conv.messages.map((msg, idx) => (
                    <div key={msg.id} className="bg-white p-3 rounded border">
                      <div className="text-xs text-gray-500 mb-2">
                        Message {idx + 1} •{" "}
                        {new Date(msg.created_at).toLocaleString()} •{" "}
                        {msg.response_time_ms}ms
                      </div>

                      <div className="mb-3">
                        <div className="text-sm font-semibold text-blue-700 mb-1">
                          User:
                        </div>
                        <div className="text-sm bg-blue-50 p-2 rounded">
                          {msg.user_message}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-green-700 mb-1">
                          Bot:
                        </div>
                        <div className="text-sm bg-green-50 p-2 rounded">
                          {msg.bot_response}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
