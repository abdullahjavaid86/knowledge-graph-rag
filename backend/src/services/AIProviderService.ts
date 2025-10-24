import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { ChatRequest, ChatResponse, ModelProvider } from '../types';
import { logger } from '../utils/logger';

export class AIProviderService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateResponse(request: ChatRequest, userApiKey?: string): Promise<ChatResponse> {
    // Set defaults: if no provider specified, try OpenAI first, then fallback to Ollama
    const provider = request.provider || this.getDefaultProvider();
    const model = request.model || this.getDefaultModel(provider);

    try {
      switch (provider) {
        case 'openai':
          return await this.generateOpenAIResponse(request, userApiKey);
        case 'anthropic':
          return await this.generateAnthropicResponse(request, userApiKey);
        case 'ollama':
          return await this.generateOllamaResponse(request, model);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error: any) {
      // If the primary provider fails (e.g., quota exceeded), fallback to Ollama
      if (provider !== 'ollama') {
        logger.warn(`${provider} failed, falling back to Ollama:`, error.message);
        try {
          return await this.generateOllamaResponse(request, process.env.OLLAMA_MODEL || 'llama2');
        } catch (ollamaError: any) {
          logger.error('Both primary provider and Ollama failed:', ollamaError);
          throw new Error(`All AI providers failed. Primary: ${error.message}, Ollama: ${ollamaError.message}`);
        }
      }
      throw error;
    }
  }

  private getDefaultProvider(): string {
    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      return 'openai';
    }
    // Check if Anthropic API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      return 'anthropic';
    }
    // Default to Ollama
    return 'ollama';
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
      case 'anthropic':
        return process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
      case 'ollama':
        return process.env.OLLAMA_MODEL || 'llama2';
      default:
        return process.env.OLLAMA_MODEL || 'llama2';
    }
  }

  private async generateOpenAIResponse(request: ChatRequest, userApiKey?: string): Promise<ChatResponse> {
    try {
      const apiKey = userApiKey || process.env.OPENAI_API_KEY;
      const model = request.model || 'gpt-4-turbo-preview';

      const openai = new OpenAI({ apiKey });

      const messages = this.buildMessages(request);
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const message = response.choices[0]?.message?.content || '';
      const tokens = response.usage?.total_tokens || 0;

      logger.info(`OpenAI response generated with ${tokens} tokens`);

      return {
        message,
        sessionId: request.sessionId || this.generateSessionId(),
        metadata: {
          model: model,
          provider: 'openai',
          tokens: tokens,
          sources: request.context
        }
      };
    } catch (error) {
      logger.error('Error generating OpenAI response:', error);
      throw new Error('Failed to generate OpenAI response');
    }
  }

  private async generateAnthropicResponse(request: ChatRequest, userApiKey?: string): Promise<ChatResponse> {
    try {
      const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
      const model = request.model || 'claude-3-sonnet-20240229';

      const anthropic = new Anthropic({ apiKey });

      const systemPrompt = request.context ? 
        `Context: ${request.context.join('\n\n')}\n\n` : '';

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.message
          }
        ]
      });

      const message = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const tokens = response.usage.input_tokens + response.usage.output_tokens;

      logger.info(`Anthropic response generated with ${tokens} tokens`);

      return {
        message,
        sessionId: request.sessionId || this.generateSessionId(),
        metadata: {
          model: model,
          provider: 'anthropic',
          tokens: tokens,
          sources: request.context
        }
      };
    } catch (error) {
      logger.error('Error generating Anthropic response:', error);
      throw new Error('Failed to generate Anthropic response');
    }
  }

  private async generateOllamaResponse(request: ChatRequest, model?: string): Promise<ChatResponse> {
    try {
      const ollamaModel = model || process.env.OLLAMA_MODEL || 'llama2';
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

      const systemPrompt = request.context ? 
        `Context: ${request.context.join('\n\n')}\n\n` : '';

      const response = await axios.post(`${baseUrl}/api/generate`, {
        model: ollamaModel,
        prompt: `${systemPrompt}${request.message}`,
        stream: false
      });

      const message = response.data.response || '';
      const tokens = 0; // Ollama doesn't provide token count

      logger.info(`Ollama response generated`);

      return {
        message,
        sessionId: request.sessionId || this.generateSessionId(),
        metadata: {
          model: ollamaModel,
          provider: 'ollama',
          tokens: tokens,
          sources: request.context
        }
      };
    } catch (error) {
      logger.error('Error generating Ollama response:', error);
      throw new Error('Failed to generate Ollama response');
    }
  }

  private buildMessages(request: ChatRequest): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.context && request.context.length > 0) {
      messages.push({
        role: 'system',
        content: `Context: ${request.context.join('\n\n')}`
      });
    }

    messages.push({
      role: 'user',
      content: request.message
    });

    return messages;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAvailableProviders(userId?: string): Promise<ModelProvider[]> {
    const providers: ModelProvider[] = [];
    
    // Add default providers with environment API keys
    if (process.env.OPENAI_API_KEY) {
      providers.push({
        name: 'OpenAI (Default)',
        type: 'openai',
        models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
        apiKey: process.env.OPENAI_API_KEY,
        isDefault: true
      });
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push({
        name: 'Anthropic (Default)',
        type: 'anthropic',
        models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
        apiKey: process.env.ANTHROPIC_API_KEY,
        isDefault: true
      });
    }
    
    // Ollama is always available if running locally
    providers.push({
      name: 'Ollama (Local)',
      type: 'ollama',
      models: ['llama2', 'codellama', 'mistral', 'neural-chat', 'deepseek-r1:1.5b'],
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      isDefault: true
    });

    // Add user's custom API keys if userId is provided
    if (userId) {
      try {
        const { User } = await import('../models/User');
        const user = await User.findById(userId).select('apiKeys');
        
        if (user && user.apiKeys) {
          user.apiKeys.forEach((apiKey) => {
            if (apiKey.isActive) {
              const customProvider: ModelProvider = {
                name: `${apiKey.provider.charAt(0).toUpperCase() + apiKey.provider.slice(1)} (Custom)`,
                type: apiKey.provider,
                models: this.getModelsForProvider(apiKey.provider),
                apiKey: apiKey.key,
                baseUrl: apiKey.baseUrl,
                isDefault: false,
                customKeyId: apiKey._id
              };
              providers.push(customProvider);
            }
          });
        }
      } catch (error) {
        logger.error('Error fetching user API keys:', error);
      }
    }

    return providers;
  }

  private getModelsForProvider(provider: string): string[] {
    switch (provider) {
      case 'openai':
        return ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'];
      case 'anthropic':
        return ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'];
      case 'ollama':
        return ['llama2', 'codellama', 'mistral', 'neural-chat', 'deepseek-r1:1.5b', 'qwen2.5', 'gemma2'];
      default:
        return [];
    }
  }
}

export const aiProviderService = new AIProviderService();
