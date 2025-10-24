const mongoose = require('mongoose');
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

// Import models
const { KnowledgeNode } = require('../dist/models/KnowledgeNode');
const { KnowledgeRelation } = require('../dist/models/KnowledgeRelation');

async function seedSampleData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-graph-rag';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Connect to Qdrant
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    const collectionName = process.env.QDRANT_COLLECTION_NAME || 'knowledge_embeddings';

    const qdrantClient = new QdrantClient({
      url: qdrantUrl,
      apiKey: apiKey,
    });

    console.log('Connected to Qdrant');

    // Sample data
    const sampleNodes = [
      {
        userId: 'sample-user-1',
        title: 'Artificial Intelligence',
        content: 'Artificial Intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals.',
        type: 'concept',
        metadata: {
          source: 'manual',
          confidence: 0.9,
          tags: ['AI', 'technology', 'concept'],
        }
      },
      {
        userId: 'sample-user-1',
        title: 'Machine Learning',
        content: 'Machine Learning is a subset of artificial intelligence that focuses on algorithms that can learn from data without being explicitly programmed.',
        type: 'concept',
        metadata: {
          source: 'manual',
          confidence: 0.9,
          tags: ['ML', 'AI', 'algorithms'],
        }
      },
      {
        userId: 'sample-user-1',
        title: 'Neural Networks',
        content: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes that process information.',
        type: 'concept',
        metadata: {
          source: 'manual',
          confidence: 0.8,
          tags: ['neural', 'networks', 'AI'],
        }
      }
    ];

    // Create sample nodes
    const createdNodes = [];
    for (const nodeData of sampleNodes) {
      const node = new KnowledgeNode(nodeData);
      await node.save();
      createdNodes.push(node);
      console.log(`Created node: ${node.title}`);
    }

    // Create sample relations
    const sampleRelations = [
      {
        userId: 'sample-user-1',
        sourceNodeId: createdNodes[0]._id.toString(), // AI
        targetNodeId: createdNodes[1]._id.toString(), // ML
        relationType: 'contains',
        strength: 0.9,
        metadata: {
          description: 'Machine Learning is a subset of AI'
        }
      },
      {
        userId: 'sample-user-1',
        sourceNodeId: createdNodes[1]._id.toString(), // ML
        targetNodeId: createdNodes[2]._id.toString(), // Neural Networks
        relationType: 'uses',
        strength: 0.8,
        metadata: {
          description: 'Machine Learning often uses Neural Networks'
        }
      }
    ];

    for (const relationData of sampleRelations) {
      const relation = new KnowledgeRelation(relationData);
      await relation.save();
      console.log(`Created relation: ${relation.relationType}`);
    }

    console.log('Sample data created successfully!');
    console.log(`Created ${createdNodes.length} nodes and ${sampleRelations.length} relations`);
    
  } catch (error) {
    console.error('Error seeding sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedSampleData();
