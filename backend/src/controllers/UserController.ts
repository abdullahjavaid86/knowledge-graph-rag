import { Request, Response } from 'express';
import { User, ApiKey } from '../types';
import { User as UserModel } from '../models/User';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UserController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password } = req.body;

      if (!email || !name || !password) {
        res.status(400).json({ 
          success: false, 
          error: 'Email, name, and password are required' 
        });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        res.status(409).json({ 
          success: false, 
          error: 'User already exists' 
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = new UserModel({
        email,
        name,
        password: hashedPassword,
        apiKeys: []
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
          },
          token
        }
      });
    } catch (error) {
      logger.error('Error registering user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to register user' 
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ 
          success: false, 
          error: 'Email and password are required' 
        });
        return;
      }

      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
        return;
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
          },
          token
        }
      });
    } catch (error) {
      logger.error('Error logging in user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to login' 
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized' 
        });
        return;
      }

      const user = await UserModel.findById(userId).select('-password');
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            apiKeys: user.apiKeys.map(key => ({
              id: key._id,
              provider: key.provider,
              model: key.model,
              baseUrl: key.baseUrl,
              isActive: key.isActive,
              createdAt: key.createdAt
            })),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get profile' 
      });
    }
  }

  async addApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { provider, key, model, baseUrl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized' 
        });
        return;
      }

      if (!provider || !key) {
        res.status(400).json({ 
          success: false, 
          error: 'Provider and key are required' 
        });
        return;
      }

      const apiKeyData: Omit<ApiKey, '_id' | 'createdAt'> = {
        provider: provider as ApiKey['provider'],
        key: key,
        model: model,
        baseUrl: baseUrl,
        isActive: true
      };

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      user.apiKeys.push(apiKeyData);
      await user.save();

      const addedKey = user.apiKeys[user.apiKeys.length - 1];

      res.json({
        success: true,
        data: {
          apiKey: {
            id: addedKey._id,
            provider: addedKey.provider,
            model: addedKey.model,
            baseUrl: addedKey.baseUrl,
            isActive: addedKey.isActive,
            createdAt: addedKey.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Error adding API key:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add API key' 
      });
    }
  }

  async updateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const { key, model, baseUrl, isActive } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized' 
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      const apiKey = user.apiKeys.id(keyId);
      if (!apiKey) {
        res.status(404).json({ 
          success: false, 
          error: 'API key not found' 
        });
        return;
      }

      if (key !== undefined) apiKey.key = key;
      if (model !== undefined) apiKey.model = model;
      if (baseUrl !== undefined) apiKey.baseUrl = baseUrl;
      if (isActive !== undefined) apiKey.isActive = isActive;

      await user.save();

      res.json({
        success: true,
        data: {
          apiKey: {
            id: apiKey._id,
            provider: apiKey.provider,
            model: apiKey.model,
            baseUrl: apiKey.baseUrl,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Error updating API key:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update API key' 
      });
    }
  }

  async deleteApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized' 
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      const apiKey = user.apiKeys.id(keyId);
      if (!apiKey) {
        res.status(404).json({ 
          success: false, 
          error: 'API key not found' 
        });
        return;
      }

      apiKey.deleteOne();
      await user.save();

      res.json({
        success: true,
        message: 'API key deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting API key:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete API key' 
      });
    }
  }
}

export const userController = new UserController();
