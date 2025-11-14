export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type ChatSession = {
  sessionId: string;
  createdAt: Date;
  messageCount: number;
};
