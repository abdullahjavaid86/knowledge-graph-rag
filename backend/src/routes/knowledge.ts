import { Router } from 'express';
import { knowledgeController } from '../controllers/KnowledgeController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';

const router = Router();

// Knowledge graph routes
router.post('/nodes', 
  optionalAuth,
  validateRequest(schemas.addNode),
  knowledgeController.addNode.bind(knowledgeController)
);

router.post('/relations', 
  optionalAuth,
  validateRequest(schemas.addRelation),
  knowledgeController.addRelation.bind(knowledgeController)
);

router.get('/search', 
  optionalAuth,
  knowledgeController.searchNodes.bind(knowledgeController)
);

router.get('/graph', 
  optionalAuth,
  knowledgeController.getKnowledgeGraph.bind(knowledgeController)
);

router.delete('/nodes/:nodeId', 
  optionalAuth,
  knowledgeController.deleteNode.bind(knowledgeController)
);

router.post('/upload', 
  optionalAuth,
  knowledgeController.uploadMiddleware,
  knowledgeController.uploadDocument.bind(knowledgeController)
);

export default router;
