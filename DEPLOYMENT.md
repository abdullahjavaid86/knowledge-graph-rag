# Deployment Guide

This guide covers various deployment options for the Knowledge Graph RAG application.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd KnowledgeGraphRAG
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Start Services
```bash
# Start core services
docker-compose up -d mongodb qdrant backend frontend

# Start with Ollama (optional)
docker-compose --profile ollama up -d

# Start with Redis (optional)
docker-compose --profile redis up -d

# Start with Nginx (production)
docker-compose --profile nginx up -d
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4433
- **Health Check**: http://localhost:4433/health

## 🐳 Docker Deployment

### Single Container Deployment
```bash
# Build and run backend
cd backend
docker build -t knowledge-graph-backend .
docker run -p 4433:4433 --env-file .env knowledge-graph-backend

# Build and run frontend
cd frontend
docker build -t knowledge-graph-frontend .
docker run -p 5173:5173 knowledge-graph-frontend
```

### Multi-Container Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up
docker-compose down -v
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag knowledge-graph-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/knowledge-graph-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/knowledge-graph-backend:latest
```

#### Using AWS App Runner
```yaml
# apprunner.yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building application"
run:
  runtime-version: latest
  command: docker-compose up
  network:
    port: 4433
    env: PORT
```

### Google Cloud Platform

#### Using Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/knowledge-graph-rag
gcloud run deploy --image gcr.io/PROJECT-ID/knowledge-graph-rag --platform managed
```

#### Using GKE
```yaml
# kubernetes.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: knowledge-graph-rag
spec:
  replicas: 3
  selector:
    matchLabels:
      app: knowledge-graph-rag
  template:
    metadata:
      labels:
        app: knowledge-graph-rag
    spec:
      containers:
      - name: backend
        image: knowledge-graph-backend:latest
        ports:
        - containerPort: 4433
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb:27017/knowledge-graph-rag"
        - name: QDRANT_URL
          value: "http://qdrant:6333"
```

### Azure Deployment

#### Using Azure Container Instances
```bash
# Create resource group
az group create --name knowledge-graph-rg --location eastus

# Create container instance
az container create \
  --resource-group knowledge-graph-rg \
  --name knowledge-graph-app \
  --image knowledge-graph-backend:latest \
  --ports 4433 \
  --environment-variables MONGODB_URI=mongodb://mongodb:27017/knowledge-graph-rag
```

## 🏗️ Manual Deployment

### Backend Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2
```

#### 2. Application Setup
```bash
# Clone repository
git clone <repository-url>
cd KnowledgeGraphRAG/backend

# Install dependencies
pnpm install

# Build application
pnpm run build

# Start with PM2
pm2 start dist/index.js --name knowledge-graph-backend
pm2 save
pm2 startup
```

#### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/knowledge-graph
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:4433;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/knowledge-graph/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Frontend Deployment

#### 1. Build Application
```bash
cd frontend
pnpm install
pnpm run build
```

#### 2. Deploy to Web Server
```bash
# Copy built files
sudo cp -r dist/* /var/www/knowledge-graph/frontend/

# Set permissions
sudo chown -R www-data:www-data /var/www/knowledge-graph/frontend/
```

## 🗄️ Database Setup

### MongoDB Setup

#### Local MongoDB
```bash
# Install MongoDB
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use knowledge-graph-rag
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["readWrite"]
})
```

#### MongoDB Atlas
```bash
# Get connection string
# mongodb+srv://username:password@cluster.mongodb.net/knowledge-graph-rag

# Update environment variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/knowledge-graph-rag
```

### QdrantDB Setup

#### Local QdrantDB
```bash
# Using Docker
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Using Binary
wget https://github.com/qdrant/qdrant/releases/download/v1.7.0/qdrant
chmod +x qdrant
./qdrant
```

#### Qdrant Cloud
```bash
# Get cluster URL and API key
QDRANT_URL=https://your-cluster.qdrant.tech
QDRANT_API_KEY=your-api-key
```

## 🔧 Environment Configuration

### Production Environment
```bash
# .env.production
NODE_ENV=production
PORT=4433
MONGODB_URI=mongodb://admin:password@mongodb:27017/knowledge-graph-rag?authSource=admin
QDRANT_URL=http://qdrant:6333
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-domain.com
```

### Development Environment
```bash
# .env.development
NODE_ENV=development
PORT=4433
MONGODB_URI=mongodb://localhost:27017/knowledge-graph-rag
QDRANT_URL=http://localhost:6333
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:5173
```

## 📊 Monitoring and Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Checks
```bash
# Backend health check
curl -f http://localhost:4433/health || exit 1

# Database health check
mongosh --eval "db.adminCommand('ping')"

# QdrantDB health check
curl -f http://localhost:6333/health
```

### Log Management
```bash
# View application logs
pm2 logs knowledge-graph-backend

# View system logs
sudo journalctl -u mongodb
sudo journalctl -u qdrant
```

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Configure HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Environment Security
```bash
# Secure environment file
chmod 600 .env
chown root:root .env
```

## 🚀 Scaling

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/knowledge-graph-rag
      - QDRANT_URL=http://qdrant:6333
```

### Load Balancing
```nginx
# nginx.conf
upstream backend {
    server backend1:4433;
    server backend2:4433;
    server backend3:4433;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://admin:password@localhost:27017/knowledge-graph-rag" --out=/backup/

# QdrantDB backup
curl -X POST "http://localhost:6333/collections/knowledge_embeddings/snapshots"
```

### Application Backup
```bash
# Backup application data
tar -czf knowledge-graph-backup-$(date +%Y%m%d).tar.gz \
  /var/www/knowledge-graph/ \
  /backup/
```

## 🧪 Testing Deployment

### Health Checks
```bash
# Test all endpoints
curl -f http://localhost:4433/health
curl -f http://localhost:4433/api/chat/providers
curl -f http://localhost:5173
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 📝 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check QdrantDB status
docker ps | grep qdrant
```

#### Application Issues
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs knowledge-graph-backend

# Restart application
pm2 restart knowledge-graph-backend
```

#### Network Issues
```bash
# Check ports
netstat -tlnp | grep :4433
netstat -tlnp | grep :5173

# Test connectivity
telnet localhost 4433
telnet localhost 5173
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [QdrantDB Documentation](https://qdrant.tech/documentation/)

---

**For support and questions, please refer to the main README.md file or create an issue on GitHub.**
