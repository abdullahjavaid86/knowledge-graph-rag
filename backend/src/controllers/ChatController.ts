import { Request, Response } from 'express';
import { ChatRequest, RAGQuery } from '../types';
import { knowledgeGraphService } from '../services/KnowledgeGraphService';
import { aiProviderService } from '../services/AIProviderService';
import { ChatSession } from '../models/ChatSession';
import { logger } from '../utils/logger';

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, sessionId, model, provider, useRAG = true, customKeyId, apiKey, baseUrl } = req.body;
      const userId = req.user?.id || 'anonymous';

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      let response;

      if (useRAG) {
        // Use RAG for enhanced responses
        const ragQuery: RAGQuery = {
          query: message,
          userId,
          sessionId,
          model,
          provider,
          maxResults: 5,
          threshold: 0.7,
          customKeyId,
          apiKey,
          baseUrl,
        };

        response = await knowledgeGraphService().performRAGQuery(ragQuery);
      } else {
        // Direct AI response without RAG
        const chatRequest: ChatRequest = {
          message,
          sessionId,
          model,
          provider,
          customKeyId,
          apiKey,
          baseUrl,
        };

        const aiResponse = await aiProviderService.generateResponse(
          chatRequest,
          apiKey
        );
        response = {
          answer: aiResponse.message,
          sources: [],
          confidence: 1.0,
          metadata: aiResponse.metadata,
        };
      }

      // Save to chat session
      if (sessionId) {
        await this.saveToSession(
          sessionId,
          userId,
          message,
          response.answer,
          response.metadata
        );
      }

      res.json({
        success: true,
        data: {
          message: response.answer,
          sessionId: sessionId || (response.metadata as any).sessionId,
          sources: response.sources,
          confidence: response.confidence,
          metadata: response.metadata,
        },
      });
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message',
      });
    }
  }

  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { title } = req.body;
      const userId = req.user?.id || 'anonymous';

      const session = new ChatSession({
        userId,
        title: title || 'New Chat Session',
        messages: [],
      });

      await session.save();

      res.json({
        success: true,
        data: {
          sessionId: session._id,
          title: session.title,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create session',
      });
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'anonymous';
      const { page = 1, limit = 20 } = req.query;

      const sessions = await ChatSession.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .select('_id title createdAt updatedAt messages');

      const total = await ChatSession.countDocuments({ userId });

      res.json({
        success: true,
        data: {
          sessions: sessions.map((session) => ({
            id: session._id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: session.messages.length,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sessions',
      });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || 'anonymous';

      const session = await ChatSession.findOne({
        _id: sessionId,
        userId,
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: session._id,
          title: session.title,
          messages: session.messages,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session',
      });
    }
  }

  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || 'anonymous';

      const result = await ChatSession.deleteOne({
        _id: sessionId,
        userId,
      });

      if (result.deletedCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete session',
      });
    }
  }

  async getAvailableProviders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const providers = await aiProviderService.getAvailableProviders(userId);

      res.json({
        success: true,
        data: { providers },
      });
    } catch (error) {
      logger.error('Error getting providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get providers',
      });
    }
  }

  private async saveToSession(
    sessionId: string,
    userId: string,
    userMessage: string,
    assistantMessage: string,
    metadata: any
  ): Promise<void> {
    try {
      await ChatSession.updateOne(
        { _id: sessionId, userId },
        {
          $push: {
            messages: [
              {
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
              },
              {
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date(),
                metadata: {
                  model: metadata.model,
                  provider: metadata.provider,
                  tokens: metadata.tokens,
                },
              },
            ],
          },
        }
      );
    } catch (error) {
      logger.error('Error saving to session:', error);
    }
  }
}

export const chatController = new ChatController();
