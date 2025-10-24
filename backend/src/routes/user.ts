import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';

const router = Router();

// User routes
router.post('/register', 
  validateRequest(schemas.register),
  userController.register.bind(userController)
);

router.post('/login', 
  validateRequest(schemas.login),
  userController.login.bind(userController)
);

router.get('/profile', 
  authenticateToken,
  userController.getProfile.bind(userController)
);

router.post('/api-keys', 
  authenticateToken,
  validateRequest(schemas.addApiKey),
  userController.addApiKey.bind(userController)
);

router.put('/api-keys/:keyId', 
  authenticateToken,
  validateRequest(schemas.updateApiKey),
  userController.updateApiKey.bind(userController)
);

router.delete('/api-keys/:keyId', 
  authenticateToken,
  userController.deleteApiKey.bind(userController)
);

export default router;
