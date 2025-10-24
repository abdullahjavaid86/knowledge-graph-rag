const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-graph-rag';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the KnowledgeNode collection
    const db = mongoose.connection.db;
    const collection = db.collection('knowledgenodes');

    // Drop the problematic compound index
    try {
      await collection.dropIndex('userId_1_type_1_metadata.tags_1_title_text_content_text_connections_1');
      console.log('Dropped problematic compound index');
    } catch (error) {
      console.log('Index not found or already dropped:', error.message);
    }

    // Create separate indexes
    await collection.createIndex({ userId: 1, type: 1 });
    console.log('Created userId + type index');

    await collection.createIndex({ userId: 1, 'metadata.tags': 1 });
    console.log('Created userId + tags index');

    await collection.createIndex({ connections: 1 });
    console.log('Created connections index');

    await collection.createIndex({ title: 'text', content: 'text' });
    console.log('Created text search index');

    console.log('All indexes created successfully');
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixIndexes();
