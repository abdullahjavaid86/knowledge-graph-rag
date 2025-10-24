import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User as UserModel } from '../models/User';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Verify user still exists
    const user = await UserModel.findById(decoded.userId).select('_id email');
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      const user = await UserModel.findById(decoded.userId).select('_id email');
      if (user) {
        req.user = {
          id: user._id.toString(),
          email: user.email
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
