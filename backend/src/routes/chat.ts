import { Router } from 'express';
import { chatController } from '../controllers/ChatController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';

const router = Router();

// Chat routes
router.post('/message', 
  optionalAuth,
  validateRequest(schemas.chatMessage),
  chatController.sendMessage.bind(chatController)
);

router.post('/sessions', 
  optionalAuth,
  validateRequest(schemas.createSession),
  chatController.createSession.bind(chatController)
);

router.get('/sessions', 
  optionalAuth,
  chatController.getSessions.bind(chatController)
);

router.get('/sessions/:sessionId', 
  optionalAuth,
  chatController.getSession.bind(chatController)
);

router.delete('/sessions/:sessionId', 
  optionalAuth,
  chatController.deleteSession.bind(chatController)
);

router.get('/providers', 
  chatController.getAvailableProviders.bind(chatController)
);

export default router;
