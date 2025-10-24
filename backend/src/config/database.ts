import mongoose from 'mongoose';
import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '../utils/logger';

class DatabaseManager {
  private static instance: DatabaseManager;
  private qdrantClient: QdrantClient | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connectMongoDB(): Promise<void> {
    try {
      const mongoUri =
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/knowledge-graph-rag';

      await mongoose.connect(mongoUri);
      logger.info('Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async connectQdrant(): Promise<void> {
    try {
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
      const apiKey = process.env.QDRANT_API_KEY;

      this.qdrantClient = new QdrantClient({
        url: qdrantUrl,
        apiKey: apiKey,
      });

      // Test connection
      await this.qdrantClient.getCollections();
      logger.info('Connected to Qdrant successfully');

      // Ensure collection exists
      await this.ensureCollectionExists();
    } catch (error) {
      logger.error('Failed to connect to Qdrant:', error);
      throw error;
    }
  }

  public getQdrantClient(): QdrantClient {
    if (!this.qdrantClient) {
      throw new Error(
        'Qdrant client not initialized. Call connectQdrant() first.'
      );
    }
    return this.qdrantClient;
  }

  private async ensureCollectionExists(): Promise<void> {
    if (!this.qdrantClient) return;

    const collectionName =
      process.env.QDRANT_COLLECTION_NAME || 'knowledge_embeddings';

    try {
      const collections = await this.qdrantClient.getCollections();
      const collectionExists = collections.collections.some(
        (col) => col.name === collectionName
      );

      if (collectionExists) {
        // Check if collection needs to be updated for multi-vector support
        const collectionInfo = await this.qdrantClient.getCollection(
          collectionName
        );
        if (
          collectionInfo.config.params.vectors &&
          typeof collectionInfo.config.params.vectors === 'object' &&
          'size' in collectionInfo.config.params.vectors
        ) {
          // Collection has old single-vector format, we need to recreate it
          logger.info(
            'Updating collection to support multiple vector dimensions...'
          );
          await this.qdrantClient.deleteCollection(collectionName);
          await this.qdrantClient.createCollection(collectionName, {
            vectors: {
              openai: {
                size: 1536,
                distance: 'Cosine',
              },
              ollama: {
                size: 768,
                distance: 'Cosine',
              },
            },
          });
          logger.info(
            `Updated Qdrant collection: ${collectionName} with multi-vector support`
          );
        }
      } else {
        // Create collection with multiple vector configurations to support different embedding models
        await this.qdrantClient.createCollection(collectionName, {
          vectors: {
            // Support both OpenAI (1536) and Ollama (768) embedding dimensions
            openai: {
              size: 1536,
              distance: 'Cosine',
            },
            ollama: {
              size: 768,
              distance: 'Cosine',
            },
          },
        });
        logger.info(
          `Created Qdrant collection: ${collectionName} with multi-vector support`
        );
      }
    } catch (error) {
      logger.error('Error ensuring collection exists:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
    }
  }
}

export const databaseManager = DatabaseManager.getInstance();
