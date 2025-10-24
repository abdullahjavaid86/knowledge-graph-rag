export interface User {
  _id: string;
  email: string;
  name: string;
  password?: string;
  apiKeys: ApiKey[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  _id: string;
  provider: 'openai' | 'anthropic' | 'ollama';
  key: string;
  model?: string;
  baseUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    sources?: string[];
  };
}

export interface KnowledgeNode {
  _id: string;
  userId: string;
  title: string;
  content: string;
  type: 'document' | 'concept' | 'entity' | 'relation';
  embedding?: number[];
  metadata: {
    source?: string;
    confidence?: number;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  connections: string[];
}

export interface KnowledgeRelation {
  _id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
  strength: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface RAGQuery {
  query: string;
  userId: string;
  sessionId?: string;
  model?: string;
  provider?: string;
  maxResults?: number;
  threshold?: number;
  customKeyId?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface RAGResponse {
  answer: string;
  sources: KnowledgeNode[];
  confidence: number;
  metadata: {
    model: string;
    provider: string;
    tokens: number;
    processingTime: number;
  };
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  tokens: number;
}

export interface ModelProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'ollama';
  models: string[];
  baseUrl?: string;
  apiKey?: string;
  isDefault?: boolean;
  customKeyId?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  model?: string;
  provider?: string;
  context?: string[];
  useRAG?: boolean;
  customKeyId?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  metadata: {
    model: string;
    provider: string;
    tokens: number;
    sources?: string[];
  };
}

export interface DocumentUpload {
  filename: string;
  content: string;
  type: 'pdf' | 'txt' | 'md' | 'docx';
  size: number;
}

export interface ProcessingResult {
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
  summary: string;
}
