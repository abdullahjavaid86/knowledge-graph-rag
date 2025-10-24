export interface User {
  id: string;
  email: string;
  name: string;
  apiKeys: ApiKey[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  provider: 'openai' | 'anthropic' | 'ollama';
  key: string;
  model?: string;
  baseUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
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
  metadata: {
    source?: string;
    confidence?: number;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
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
  createdAt: string;
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
  useRAG?: boolean;
  customKeyId?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  sources: KnowledgeNode[];
  confidence: number;
  metadata: {
    model: string;
    provider: string;
    tokens: number;
    processingTime?: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
}

export interface KnowledgeState {
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
  isLoading: boolean;
  error: string | null;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
