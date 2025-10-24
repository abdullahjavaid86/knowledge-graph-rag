import { QdrantClient } from '@qdrant/js-client-rest';
import {
  KnowledgeNode,
  KnowledgeRelation,
  RAGQuery,
  RAGResponse,
  ProcessingResult,
} from '../types';
import {
  KnowledgeNode as KnowledgeNodeModel,
  KnowledgeRelation as KnowledgeRelationModel,
} from '../models';
import { embeddingService } from './EmbeddingService';
import { aiProviderService } from './AIProviderService';
import { databaseManager } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class KnowledgeGraphService {
  private get qdrantClient(): QdrantClient {
    return databaseManager.getQdrantClient();
  }

  private convertObjectIdToUUID(objectId: string): string {
    return uuidv4();
  }

  private getVectorName(model: string): string {
    // Determine vector name based on embedding model
    if (model.includes('text-embedding') || model.includes('openai')) {
      return 'openai';
    } else if (model.includes('nomic-embed') || model.includes('ollama')) {
      return 'ollama';
    } else {
      // Default to openai for unknown models
      return 'openai';
    }
  }

  async addNode(
    node: Omit<KnowledgeNode, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<KnowledgeNode> {
    try {
      // Generate embedding for the node content
      const embeddingResponse = await embeddingService.generateEmbedding({
        text: `${node.title} ${node.content}`,
      });

      // Save to MongoDB
      const savedNode = new KnowledgeNodeModel({
        ...node,
        embedding: embeddingResponse.embedding,
      });
      await savedNode.save();

      // Determine vector name based on embedding model
      const vectorName = this.getVectorName(embeddingResponse.model);

      // Save to Qdrant for vector search
      // Convert MongoDB ObjectId to UUID format for Qdrant
      const qdrantId = this.convertObjectIdToUUID(savedNode._id.toString());

      await this.qdrantClient.upsert(
        process.env.QDRANT_COLLECTION_NAME || 'knowledge_embeddings',
        {
          wait: true,
          points: [
            {
              id: qdrantId,
              vector: {
                [vectorName]: embeddingResponse.embedding,
              },
              payload: {
                mongoId: savedNode._id.toString(),
                userId: node.userId,
                title: node.title,
                content: node.content,
                type: node.type,
                metadata: node.metadata,
                embeddingModel: embeddingResponse.model,
              },
            },
          ],
        }
      );

      logger.info(`Added knowledge node: ${savedNode._id}`);
      return savedNode.toObject();
    } catch (error) {
      logger.error('Error adding knowledge node:', error);
      throw new Error('Failed to add knowledge node');
    }
  }

  async addRelation(
    relation: Omit<KnowledgeRelation, '_id' | 'createdAt'>
  ): Promise<KnowledgeRelation> {
    try {
      const savedRelation = new KnowledgeRelationModel(relation);
      await savedRelation.save();

      // Update connections in both nodes
      await KnowledgeNodeModel.updateOne(
        { _id: relation.sourceNodeId },
        { $addToSet: { connections: relation.targetNodeId } }
      );

      await KnowledgeNodeModel.updateOne(
        { _id: relation.targetNodeId },
        { $addToSet: { connections: relation.sourceNodeId } }
      );

      logger.info(`Added knowledge relation: ${savedRelation._id}`);
      return savedRelation.toObject();
    } catch (error) {
      logger.error('Error adding knowledge relation:', error);
      throw new Error('Failed to add knowledge relation');
    }
  }

  async searchSimilarNodes(
    query: string,
    userId: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<KnowledgeNode[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding({
        text: query,
      });
      const vectorName = this.getVectorName(queryEmbedding.model);

      // Search in Qdrant
      const searchResult = await this.qdrantClient.search(
        process.env.QDRANT_COLLECTION_NAME || 'knowledge_embeddings',
        {
          vector: {
            name: vectorName,
            vector: queryEmbedding.embedding,
          },
          limit: limit,
          score_threshold: threshold,
          filter: {
            must: [
              {
                key: 'userId',
                match: { value: userId },
              },
            ],
          },
        }
      );

      // Get full node data from MongoDB
      // Extract mongoId from Qdrant results
      const mongoIds = searchResult
        .map((result) => result.payload?.mongoId)
        .filter(Boolean);
      const nodes = await KnowledgeNodeModel.find({
        _id: { $in: mongoIds },
        userId,
      });

      // Sort by similarity score
      const sortedNodes = nodes.sort((a, b) => {
        const scoreA =
          searchResult.find((r) => r.payload?.mongoId === a._id.toString())
            ?.score || 0;
        const scoreB =
          searchResult.find((r) => r.payload?.mongoId === b._id.toString())
            ?.score || 0;
        return scoreB - scoreA;
      });

      return sortedNodes.map((node) => node.toObject());
    } catch (error) {
      logger.error('Error searching similar nodes:', error);
      throw new Error('Failed to search similar nodes');
    }
  }

  async performRAGQuery(query: RAGQuery): Promise<RAGResponse> {
    try {
      const startTime = Date.now();

      // Search for relevant knowledge
      const relevantNodes = await this.searchSimilarNodes(
        query.query,
        query.userId,
        query.maxResults || 5,
        query.threshold || 0.7
      );

      // Build context from relevant nodes
      const context = relevantNodes.map(
        (node) =>
          `Title: ${node.title}\nContent: ${node.content}\nType: ${node.type}`
      );

      // Generate response using AI
      const chatRequest = {
        message: query.query,
        sessionId: query.sessionId,
        model: query.model,
        provider: query.provider,
        context,
        customKeyId: query.customKeyId,
        apiKey: query.apiKey,
        baseUrl: query.baseUrl,
      };

      const aiResponse = await aiProviderService.generateResponse(chatRequest, query.apiKey);

      const processingTime = Date.now() - startTime;

      // Calculate confidence based on similarity scores
      const confidence =
        relevantNodes.length > 0
          ? relevantNodes.reduce(
              (sum, node) => sum + (node.metadata.confidence || 0.5),
              0
            ) / relevantNodes.length
          : 0.5;

      return {
        answer: aiResponse.message,
        sources: relevantNodes,
        confidence,
        metadata: {
          model: aiResponse.metadata.model,
          provider: aiResponse.metadata.provider,
          tokens: aiResponse.metadata.tokens,
          processingTime: processingTime,
        },
      };
    } catch (error) {
      logger.error('Error performing RAG query:', error);
      throw new Error('Failed to perform RAG query');
    }
  }

  async processDocument(
    content: string,
    userId: string,
    source?: string
  ): Promise<ProcessingResult> {
    try {
      // Simple text processing - in a real implementation, you'd use more sophisticated NLP
      const sentences = content
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);
      const nodes: KnowledgeNode[] = [];
      const relations: KnowledgeRelation[] = [];

      // Create nodes for each meaningful sentence
      for (const sentence of sentences) {
        if (sentence.trim().length < 20) continue;

        const node = await this.addNode({
          userId,
          title: `${sentence.substring(0, 100)}...`,
          content: sentence.trim(),
          type: 'concept',
          metadata: {
            source,
            confidence: 0.8,
            tags: ['document'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          connections: [],
        });

        nodes.push(node);
      }

      // Create relations between similar nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].embedding && nodes[j].embedding) {
            const similarity = embeddingService.calculateSimilarity(
              nodes[i].embedding!,
              nodes[j].embedding!
            );

            if (similarity > 0.7) {
              const relation = await this.addRelation({
                userId,
                sourceNodeId: nodes[i]._id,
                targetNodeId: nodes[j]._id,
                relationType: 'similar',
                strength: similarity,
                metadata: {
                  similarity,
                },
              });

              relations.push(relation);
            }
          }
        }
      }

      const summary = `Processed document with ${nodes.length} concepts and ${relations.length} relations`;

      return {
        nodes,
        relations,
        summary,
      };
    } catch (error) {
      logger.error('Error processing document:', error);
      throw new Error('Failed to process document');
    }
  }

  async getKnowledgeGraph(
    userId: string,
    limit: number = 100
  ): Promise<{ nodes: KnowledgeNode[]; relations: KnowledgeRelation[] }> {
    try {
      const nodes = await KnowledgeNodeModel.find({ userId })
        .limit(limit)
        .sort({ createdAt: -1 });

      const nodeIds = nodes.map((node) => node._id);
      const relations = await KnowledgeRelationModel.find({
        userId,
        $or: [
          { sourceNodeId: { $in: nodeIds } },
          { targetNodeId: { $in: nodeIds } },
        ],
      });

      return {
        nodes: nodes.map((node) => node.toObject()),
        relations: relations.map((relation) => relation.toObject()),
      };
    } catch (error) {
      logger.error('Error getting knowledge graph:', error);
      throw new Error('Failed to get knowledge graph');
    }
  }

  async deleteNode(nodeId: string, userId: string): Promise<void> {
    try {
      // Delete from MongoDB
      await KnowledgeNodeModel.deleteOne({ _id: nodeId, userId });

      // Delete from Qdrant using UUID format
      const qdrantId = this.convertObjectIdToUUID(nodeId);
      await this.qdrantClient.delete(
        process.env.QDRANT_COLLECTION_NAME || 'knowledge_embeddings',
        {
          wait: true,
          points: [qdrantId],
        }
      );

      // Delete related relations
      await KnowledgeRelationModel.deleteMany({
        userId,
        $or: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
      });

      logger.info(`Deleted knowledge node: ${nodeId}`);
    } catch (error) {
      logger.error('Error deleting knowledge node:', error);
      throw new Error('Failed to delete knowledge node');
    }
  }
}

let _knowledgeGraphService: KnowledgeGraphService | null = null;

export const knowledgeGraphService = (): KnowledgeGraphService => {
  if (!_knowledgeGraphService) {
    _knowledgeGraphService = new KnowledgeGraphService();
  }
  return _knowledgeGraphService;
};
