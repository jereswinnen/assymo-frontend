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

// Phase 2: Document and embedding types
export type DocumentInfo = {
  documentName: string;
  chunkCount: number;
  totalCharacters: number;
  uploadedAt: Date;
  metadata?: Record<string, any>;
};

export type RetrievalTestResult = {
  chunks: string[];
  query: string;
};
