import OpenAI from 'openai';
import axios from 'axios';
import { EmbeddingRequest, EmbeddingResponse } from '../types';
import { logger } from '../utils/logger';

export class EmbeddingService {
  private openai: OpenAI;
  private useOllamaFallback: boolean;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.useOllamaFallback = process.env.USE_OLLAMA_FALLBACK !== 'false';
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const model = request.model || process.env.DEFAULT_EMBEDDING_MODEL || 'text-embedding-3-small';
      
      const response = await this.openai.embeddings.create({
        model: model,
        input: request.text,
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;
      const tokens = response.usage.total_tokens;

      logger.info(`Generated embedding with ${tokens} tokens`);

      return {
        embedding,
        model: model,
        tokens
      };
    } catch (error: any) {
      logger.warn('OpenAI embedding failed:', error.message);
      
      // Fallback to Ollama if OpenAI fails (quota exceeded, etc.)
      if (this.useOllamaFallback) {
        try {
          logger.info('Attempting Ollama fallback for embedding generation');
          return await this.generateEmbeddingWithOllama(request.text, request.model);
        } catch (ollamaError) {
          logger.error('Both OpenAI and Ollama embedding failed:', ollamaError);
          throw new Error('Failed to generate embedding with any provider');
        }
      } else {
        throw new Error(`OpenAI embedding failed: ${error.message}`);
      }
    }
  }

  async generateEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    try {
      const embeddingModel = model || process.env.DEFAULT_EMBEDDING_MODEL || 'text-embedding-3-small';
      
      const response = await this.openai.embeddings.create({
        model: embeddingModel,
        input: texts,
        encoding_format: 'float',
      });

      const embeddings = response.data.map(item => ({
        embedding: item.embedding,
        model: embeddingModel,
        tokens: response.usage.total_tokens / texts.length
      }));

      logger.info(`Generated ${embeddings.length} embeddings`);

      return embeddings;
    } catch (error: any) {
      logger.warn('OpenAI batch embedding failed:', error.message);
      
      // Fallback to Ollama for each text individually
      if (this.useOllamaFallback) {
        try {
          logger.info('Attempting Ollama fallback for batch embedding generation');
          const embeddings: EmbeddingResponse[] = [];
          for (const text of texts) {
            const embedding = await this.generateEmbeddingWithOllama(text, model);
            embeddings.push(embedding);
          }
          logger.info(`Generated ${embeddings.length} embeddings with Ollama fallback`);
          return embeddings;
        } catch (ollamaError) {
          logger.error('Both OpenAI and Ollama batch embedding failed:', ollamaError);
          throw new Error('Failed to generate embeddings with any provider');
        }
      } else {
        throw new Error(`OpenAI batch embedding failed: ${error.message}`);
      }
    }
  }

  async generateEmbeddingWithOllama(text: string, model?: string): Promise<EmbeddingResponse> {
    try {
      const ollamaModel = model || process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      
      const response = await axios.post(`${baseUrl}/api/embeddings`, {
        model: ollamaModel,
        prompt: text
      });

      return {
        embedding: response.data.embedding,
        model: ollamaModel,
        tokens: 0 // Ollama doesn't provide token count
      };
    } catch (error) {
      logger.error('Error generating embedding with Ollama:', error);
      throw new Error('Failed to generate embedding with Ollama');
    }
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }
}

export const embeddingService = new EmbeddingService();
