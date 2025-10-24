# Knowledge Graph RAG Chat Assistant

A comprehensive Knowledge Graph-based Retrieval Augmented Generation (RAG) chat assistant built with Node.js/Express backend, React/TypeScript frontend, QdrantDB vector database, and MongoDB for data storage.

## 🚀 Features

- **Multi-Provider AI Support**: OpenAI, Anthropic, and Ollama with automatic fallback
- **Knowledge Graph Visualization**: Interactive graph with drag-to-connect nodes
- **RAG (Retrieval Augmented Generation)**: Enhanced responses using knowledge base
- **Multi-Tenant Architecture**: Support for custom API keys and models
- **Real-time Chat**: WebSocket-based real-time communication
- **Document Upload**: PDF, TXT, MD, DOCX file processing
- **Vector Search**: Semantic search using QdrantDB
- **User Management**: API key management and user settings

## 🏗️ Architecture

```
KnowledgeGraphRAG/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── config/         # Configuration
│   └── package.json
├── frontend/               # React/TypeScript UI
│   ├── src/
│   │   ├── pages/         # React components
│   │   ├── stores/        # Zustand state management
│   │   ├── lib/           # API client
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for API server
- **MongoDB** with **Mongoose** for data storage
- **QdrantDB** for vector database
- **Socket.IO** for real-time communication
- **JWT** for authentication

### Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Ant Design** for UI components
- **React Flow** for graph visualization
- **Zustand** for state management

### AI/ML
- **OpenAI API** for GPT models
- **Anthropic API** for Claude models
- **Ollama** for local models
- **Vector embeddings** for semantic search

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm
- **MongoDB** (local or cloud)
- **QdrantDB** (local or cloud)
- **Ollama** (optional, for local models)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd KnowledgeGraphRAG
```

### 2. Install Dependencies

```bash
# Install all dependencies (root level)
pnpm install

# Or install individually
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 3. Environment Setup

Create environment files:

#### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/knowledge-graph-rag
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_NAME=knowledge_embeddings

# AI Providers
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:1.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Server
PORT=4433
NODE_ENV=development
JWT_SECRET=your-jwt-secret

# Fallback Settings
USE_OLLAMA_FALLBACK=true
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:4433/api
VITE_WS_URL=http://localhost:4433
```

### 4. Start Services

#### Start MongoDB and QdrantDB
```bash
# MongoDB (if using local)
mongod

# QdrantDB (if using local)
docker run -p 6333:6333 qdrant/qdrant
```

#### Start Ollama (Optional)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull deepseek-r1:1.5b
ollama pull nomic-embed-text
```

#### Start Application
```bash
# Start backend
cd backend
pnpm run dev

# Start frontend (in new terminal)
cd frontend
pnpm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4433
- **Health Check**: http://localhost:4433/health

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Chat
- `POST /api/chat/message` - Send message
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/sessions` - Create new session
- `DELETE /api/chat/sessions/:id` - Delete session

### Knowledge Graph
- `GET /api/knowledge/graph` - Get knowledge graph
- `POST /api/knowledge/nodes` - Add knowledge node
- `POST /api/knowledge/relations` - Add relation
- `GET /api/knowledge/search` - Search nodes
- `DELETE /api/knowledge/nodes/:id` - Delete node

### Providers
- `GET /api/chat/providers` - Get available AI providers

## 🎯 Usage

### 1. Chat Interface
- Select AI provider and model
- Toggle RAG on/off
- Send messages and get responses
- View conversation history

### 2. Knowledge Graph
- **Graph View**: Visualize nodes and relations
- **Nodes View**: Manage knowledge nodes
- **Upload**: Process documents automatically

### 3. Node Management
- Add nodes manually
- Connect nodes with relations
- Search and filter nodes
- Delete nodes and relations

### 4. Document Processing
- Upload PDF, TXT, MD, DOCX files
- Automatic knowledge extraction
- Node and relation creation

## 🔧 Configuration

### AI Providers
The system supports multiple AI providers with automatic fallback:

1. **OpenAI**: GPT-4, GPT-3.5-turbo
2. **Anthropic**: Claude-3 models
3. **Ollama**: Local models (llama2, mistral, etc.)

### Vector Database
- **QdrantDB**: Multi-vector support for different embedding models
- **Embeddings**: OpenAI (1536 dims) and Ollama (768 dims)

### Database
- **MongoDB**: Document storage for nodes, relations, and chat history
- **Indexes**: Optimized for text search and relationships

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
```bash
# Build frontend
cd frontend && pnpm run build

# Start backend
cd backend && pnpm start
```

### Environment Variables
Set production environment variables:
- Database URLs
- API keys
- JWT secrets
- CORS settings

## 🧪 Testing

```bash
# Backend tests
cd backend && pnpm test

# Frontend tests
cd frontend && pnpm test

# E2E tests
pnpm run test:e2e
```

## 📝 Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # API endpoints
│   ├── services/       # Business logic
│   ├── models/         # Database schemas
│   ├── routes/         # Route definitions
│   ├── middleware/     # Express middleware
│   ├── config/         # Configuration
│   └── utils/          # Utilities

frontend/
├── src/
│   ├── pages/          # React pages
│   ├── components/     # Reusable components
│   ├── stores/         # State management
│   ├── lib/            # API client
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
```

### Code Style
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional Commits** for commit messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🔄 Updates

- **v1.0.0**: Initial release with basic RAG functionality
- **v1.1.0**: Added multi-provider support and custom API keys
- **v1.2.0**: Enhanced graph visualization and drag-to-connect
- **v1.3.0**: Improved fallback logic and error handling

---

**Built with ❤️ using Node.js, React, and modern AI technologies.**