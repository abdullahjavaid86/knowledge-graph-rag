import mongoose, { Document, Schema } from 'mongoose';
import { KnowledgeRelation as IKnowledgeRelation } from '../types';

export interface KnowledgeRelationDocument extends IKnowledgeRelation, Document {}

const KnowledgeRelationSchema = new Schema<KnowledgeRelationDocument>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  sourceNodeId: {
    type: String,
    required: true,
    ref: 'KnowledgeNode'
  },
  targetNodeId: {
    type: String,
    required: true,
    ref: 'KnowledgeNode'
  },
  relationType: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
KnowledgeRelationSchema.index({ userId: 1 });
KnowledgeRelationSchema.index({ sourceNodeId: 1 });
KnowledgeRelationSchema.index({ targetNodeId: 1 });
KnowledgeRelationSchema.index({ relationType: 1 });
KnowledgeRelationSchema.index({ sourceNodeId: 1, targetNodeId: 1 }, { unique: true });

export const KnowledgeRelation = mongoose.model<KnowledgeRelationDocument>('KnowledgeRelation', KnowledgeRelationSchema);
