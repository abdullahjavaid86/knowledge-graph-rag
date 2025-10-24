import mongoose, { Document, Schema } from 'mongoose';
import { User as IUser, ApiKey } from '../types';

export interface UserDocument extends IUser, Document {}

const ApiKeySchema = new Schema<ApiKey>({
  provider: {
    type: String,
    enum: ['openai', 'anthropic', 'ollama'],
    required: true
  },
  key: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: false
  },
  baseUrl: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  apiKeys: [ApiKeySchema]
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ 'apiKeys.provider': 1 });

export const User = mongoose.model<UserDocument>('User', UserSchema);
