import mongoose, { Document, Schema } from 'mongoose';
import { KnowledgeNode as IKnowledgeNode } from '../types';

export interface KnowledgeNodeDocument extends IKnowledgeNode, Document {}

const KnowledgeNodeSchema = new Schema<KnowledgeNodeDocument>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['document', 'concept', 'entity', 'relation'],
      required: true,
    },
    embedding: {
      type: [Number],
      required: false,
    },
    metadata: {
      source: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      tags: {
        type: [String],
        default: [],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    connections: [
      {
        type: String,
        ref: 'KnowledgeNode',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
KnowledgeNodeSchema.index({ userId: 1, type: 1 });
KnowledgeNodeSchema.index({ userId: 1, 'metadata.tags': 1 });
KnowledgeNodeSchema.index({ connections: 1 });
KnowledgeNodeSchema.index({ title: 'text', content: 'text' });

// Update the updatedAt field before saving
KnowledgeNodeSchema.pre('save', function (next) {
  this.metadata.updatedAt = new Date();
  
  // Ensure tags is always an array
  if (!Array.isArray(this.metadata.tags)) {
    this.metadata.tags = [];
  }
  
  next();
});

export const KnowledgeNode = mongoose.model<KnowledgeNodeDocument>(
  'KnowledgeNode',
  KnowledgeNodeSchema
);
