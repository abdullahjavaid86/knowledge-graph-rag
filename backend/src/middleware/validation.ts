import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }
    
    next();
  };
};

// Validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  chatMessage: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    sessionId: Joi.string().optional(),
    model: Joi.string().optional(),
    provider: Joi.string().valid('openai', 'anthropic', 'ollama').optional(),
    useRAG: Joi.boolean().optional(),
    baseUrl: Joi.string().uri().optional(),
    apiKey: Joi.string().optional(),
  }),

  createSession: Joi.object({
    title: Joi.string().min(1).max(100).optional()
  }),

  addNode: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().min(1).max(5000).required(),
    type: Joi.string().valid('document', 'concept', 'entity', 'relation').required(),
    metadata: Joi.object().optional()
  }),

  addRelation: Joi.object({
    sourceNodeId: Joi.string().required(),
    targetNodeId: Joi.string().required(),
    relationType: Joi.string().min(1).max(50).required(),
    strength: Joi.number().min(0).max(1).optional(),
    metadata: Joi.object().optional()
  }),

  addApiKey: Joi.object({
    provider: Joi.string().valid('openai', 'anthropic', 'ollama').required(),
    key: Joi.string().min(1).required(),
    model: Joi.string().optional(),
    baseUrl: Joi.string().uri().optional()
  }),

  updateApiKey: Joi.object({
    key: Joi.string().min(1).optional(),
    model: Joi.string().optional(),
    baseUrl: Joi.string().uri().optional(),
    isActive: Joi.boolean().optional()
  })
};
