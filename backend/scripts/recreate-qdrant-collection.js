const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

async function recreateCollection() {
  try {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    const collectionName = process.env.QDRANT_COLLECTION_NAME || 'knowledge_embeddings';

    const qdrantClient = new QdrantClient({
      url: qdrantUrl,
      apiKey: apiKey,
    });

    console.log('Connecting to Qdrant...');
    
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === collectionName
    );

    if (collectionExists) {
      console.log(`Deleting existing collection: ${collectionName}`);
      await qdrantClient.deleteCollection(collectionName);
    }

    console.log(`Creating new collection: ${collectionName} with multi-vector support`);
    
    // Create collection with multiple vector configurations
    await qdrantClient.createCollection(collectionName, {
      vectors: {
        openai: {
          size: 1536,
          distance: 'Cosine',
        },
        ollama: {
          size: 768,
          distance: 'Cosine',
        }
      },
    });

    console.log('Collection created successfully!');
    console.log('Supported vector configurations:');
    console.log('- openai: 1536 dimensions (for OpenAI embeddings)');
    console.log('- ollama: 768 dimensions (for Ollama embeddings)');
    
  } catch (error) {
    console.error('Error recreating collection:', error);
  }
}

recreateCollection();
