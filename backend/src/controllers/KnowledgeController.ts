import { Request, Response } from 'express';
import { KnowledgeNode, KnowledgeRelation, DocumentUpload } from '../types';
import { knowledgeGraphService } from '../services/KnowledgeGraphService';
import { logger } from '../utils/logger';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

export class KnowledgeController {
  async addNode(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, type, metadata } = req.body;
      const userId = req.user?.id || 'anonymous';

      if (!title || !content || !type) {
        res.status(400).json({ 
          success: false, 
          error: 'Title, content, and type are required' 
        });
        return;
      }

      const nodeData: Omit<KnowledgeNode, '_id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title,
        content,
        type: type as KnowledgeNode['type'],
        metadata: {
          ...metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        connections: []
      };

      const node = await knowledgeGraphService().addNode(nodeData);

      res.json({
        success: true,
        data: { node }
      });
    } catch (error) {
      logger.error('Error adding node:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add knowledge node' 
      });
    }
  }

  async addRelation(req: Request, res: Response): Promise<void> {
    try {
      const { sourceNodeId, targetNodeId, relationType, strength, metadata } = req.body;
      const userId = req.user?.id || 'anonymous';

      if (!sourceNodeId || !targetNodeId || !relationType) {
        res.status(400).json({ 
          success: false, 
          error: 'Source node ID, target node ID, and relation type are required' 
        });
        return;
      }

      const relationData: Omit<KnowledgeRelation, '_id' | 'createdAt'> = {
        userId: userId,
        sourceNodeId: sourceNodeId,
        targetNodeId: targetNodeId,
        relationType: relationType,
        strength: strength || 0.5,
        metadata: metadata || {}
      };

      const relation = await knowledgeGraphService().addRelation(relationData);

      res.json({
        success: true,
        data: { relation }
      });
    } catch (error) {
      logger.error('Error adding relation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add knowledge relation' 
      });
    }
  }

  async searchNodes(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit = 10, threshold = 0.7 } = req.query;
      const userId = req.user?.id || 'anonymous';

      if (!query) {
        res.status(400).json({ 
          success: false, 
          error: 'Query is required' 
        });
        return;
      }

      const nodes = await knowledgeGraphService().searchSimilarNodes(
        query as string,
        userId,
        Number(limit),
        Number(threshold)
      );

      res.json({
        success: true,
        data: { nodes }
      });
    } catch (error) {
      logger.error('Error searching nodes:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search knowledge nodes' 
      });
    }
  }

  async getKnowledgeGraph(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 100 } = req.query;
      const userId = req.user?.id || 'anonymous';

      const graph = await knowledgeGraphService().getKnowledgeGraph(
        userId,
        Number(limit)
      );

      res.json({
        success: true,
        data: graph
      });
    } catch (error) {
      logger.error('Error getting knowledge graph:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get knowledge graph' 
      });
    }
  }

  async deleteNode(req: Request, res: Response): Promise<void> {
    try {
      const { nodeId } = req.params;
      const userId = req.user?.id || 'anonymous';

      await knowledgeGraphService().deleteNode(nodeId, userId);

      res.json({
        success: true,
        message: 'Node deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting node:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete knowledge node' 
      });
    }
  }

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'anonymous';
      const file = req.file;

      if (!file) {
        res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
        return;
      }

      // Read file content based on type
      let content = '';
      const fileType = path.extname(file.originalname).toLowerCase();

      try {
        switch (fileType) {
          case '.txt':
          case '.md':
            content = await fs.readFile(file.path, 'utf-8');
            break;
          case '.pdf':
            // For PDF, you'd need pdf-parse library
            content = 'PDF content extraction not implemented yet';
            break;
          case '.docx':
            // For DOCX, you'd need mammoth library
            content = 'DOCX content extraction not implemented yet';
            break;
          default:
            res.status(400).json({ 
              success: false, 
              error: 'Unsupported file type' 
            });
            return;
        }

        // Process the document
        const result = await knowledgeGraphService().processDocument(
          content,
          userId,
          file.originalname
        );

        // Clean up uploaded file
        await fs.unlink(file.path);

        res.json({
          success: true,
          data: {
            filename: file.originalname,
            summary: result.summary,
            nodesCount: result.nodes.length,
            relationsCount: result.relations.length,
            nodes: result.nodes,
            relations: result.relations
          }
        });
      } catch (fileError) {
        // Clean up uploaded file on error
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          logger.error('Error cleaning up file:', cleanupError);
        }
        throw fileError;
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process document' 
      });
    }
  }

  // Middleware for file upload
  uploadMiddleware = upload.single('document');
}

export const knowledgeController = new KnowledgeController();
