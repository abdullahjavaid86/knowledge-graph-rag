import mongoose, { Document, Schema } from 'mongoose';
import { ChatSession as IChatSession, ChatMessage } from '../types';

export interface ChatSessionDocument extends IChatSession, Document {}

const ChatMessageSchema = new Schema<ChatMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    model: String,
    provider: String,
    tokens: Number,
    sources: [String]
  }
});

const ChatSessionSchema = new Schema<ChatSessionDocument>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  messages: [ChatMessageSchema]
}, {
  timestamps: true
});

// Indexes
ChatSessionSchema.index({ userId: 1, createdAt: -1 });
ChatSessionSchema.index({ 'messages.timestamp': 1 });

export const ChatSession = mongoose.model<ChatSessionDocument>('ChatSession', ChatSessionSchema);
