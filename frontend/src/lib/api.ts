import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  ChatSession,
  User,
  ApiKey,
  KnowledgeNode,
  KnowledgeRelation,
  ModelProvider,
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: 60_000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(
    email: string,
    name: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/user/register', {
      email,
      name,
      password,
    });
    return response.data;
  }

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/user/login', { email, password });
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.get('/user/profile');
    return response.data;
  }

  // API Key management
  async addApiKey(
    provider: string,
    key: string,
    model?: string,
    baseUrl?: string
  ): Promise<ApiResponse<{ apiKey: ApiKey }>> {
    const response = await this.client.post('/user/api-keys', {
      provider,
      key,
      model,
      baseUrl,
    });
    return response.data;
  }

  async updateApiKey(
    keyId: string,
    updates: Partial<ApiKey>
  ): Promise<ApiResponse<{ apiKey: ApiKey }>> {
    const response = await this.client.put(`/user/api-keys/${keyId}`, updates);
    return response.data;
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/user/api-keys/${keyId}`);
    return response.data;
  }

  // Chat endpoints
  async sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    const response = await this.client.post('/chat/message', request);
    return response.data;
  }

  async createSession(
    title?: string
  ): Promise<
    ApiResponse<{ sessionId: string; title: string; createdAt: string }>
  > {
    const response = await this.client.post('/chat/sessions', { title });
    return response.data;
  }

  async getSessions(
    page = 1,
    limit = 20
  ): Promise<ApiResponse<{ sessions: ChatSession[]; pagination: any }>> {
    const response = await this.client.get(
      `/chat/sessions?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    const response = await this.client.get(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  async deleteSession(sessionId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  async getProviders(): Promise<ApiResponse<{ providers: ModelProvider[] }>> {
    const response = await this.client.get('/chat/providers');
    return response.data;
  }

  // Knowledge graph endpoints
  async addNode(
    title: string,
    content: string,
    type: string,
    metadata?: any
  ): Promise<ApiResponse<{ node: KnowledgeNode }>> {
    const response = await this.client.post('/knowledge/nodes', {
      title,
      content,
      type,
      metadata,
    });
    return response.data;
  }

  async addRelation(
    sourceNodeId: string,
    targetNodeId: string,
    relationType: string,
    strength?: number,
    metadata?: any
  ): Promise<ApiResponse<{ relation: KnowledgeRelation }>> {
    const response = await this.client.post('/knowledge/relations', {
      sourceNodeId,
      targetNodeId,
      relationType,
      strength,
      metadata,
    });
    return response.data;
  }

  async searchNodes(
    query: string,
    limit = 10,
    threshold = 0.7
  ): Promise<ApiResponse<{ nodes: KnowledgeNode[] }>> {
    const response = await this.client.get(
      `/knowledge/search?query=${encodeURIComponent(
        query
      )}&limit=${limit}&threshold=${threshold}`
    );
    return response.data;
  }

  async getKnowledgeGraph(
    limit = 100
  ): Promise<
    ApiResponse<{ nodes: KnowledgeNode[]; relations: KnowledgeRelation[] }>
  > {
    const response = await this.client.get(`/knowledge/graph?limit=${limit}`);
    return response.data;
  }

  async deleteNode(nodeId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/knowledge/nodes/${nodeId}`);
    return response.data;
  }

  async uploadDocument(
    file: File
  ): Promise<
    ApiResponse<{
      filename: string;
      summary: string;
      nodesCount: number;
      relationsCount: number;
      nodes: KnowledgeNode[];
      relations: KnowledgeRelation[];
    }>
  > {
    const formData = new FormData();
    formData.append('document', file);

    const response = await this.client.post('/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
