import { create } from 'zustand';
import { KnowledgeNode, KnowledgeRelation } from '../types';
import { apiClient } from '../lib/api';

interface KnowledgeState {
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
  isLoading: boolean;
  error: string | null;
  searchResults: KnowledgeNode[];
  
  // Actions
  setNodes: (nodes: KnowledgeNode[]) => void;
  setRelations: (relations: KnowledgeRelation[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: KnowledgeNode[]) => void;
  
  // API calls
  loadKnowledgeGraph: () => Promise<void>;
  addNode: (title: string, content: string, type: string, metadata?: any) => Promise<KnowledgeNode | null>;
  addRelation: (sourceNodeId: string, targetNodeId: string, relationType: string, strength?: number, metadata?: any) => Promise<KnowledgeRelation | null>;
  searchNodes: (query: string, limit?: number, threshold?: number) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<boolean>;
  uploadDocument: (file: File) => Promise<{ summary: string; nodesCount: number; relationsCount: number } | null>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  nodes: [],
  relations: [],
  isLoading: false,
  error: null,
  searchResults: [],

  setNodes: (nodes) => set({ nodes }),
  setRelations: (relations) => set({ relations }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchResults: (results) => set({ searchResults: results }),

  loadKnowledgeGraph: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getKnowledgeGraph();
      
      if (response.success && response.data) {
        set({
          nodes: response.data.nodes,
          relations: response.data.relations,
        });
      }
    } catch (error) {
      set({ error: 'Failed to load knowledge graph' });
    } finally {
      set({ isLoading: false });
    }
  },

  addNode: async (title, content, type, metadata) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.addNode(title, content, type, metadata);
      
      if (response.success && response.data) {
        set((state) => ({
          nodes: [...state.nodes, response.data!.node],
        }));
        return response.data.node;
      }
      return null;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to add node' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  addRelation: async (sourceNodeId, targetNodeId, relationType, strength, metadata) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.addRelation(sourceNodeId, targetNodeId, relationType, strength, metadata);
      
      if (response.success && response.data) {
        set((state) => ({
          relations: [...state.relations, response.data!.relation],
        }));
        return response.data.relation;
      }
      return null;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to add relation' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  searchNodes: async (query, limit, threshold) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.searchNodes(query, limit, threshold);
      
      if (response.success && response.data) {
        set({ searchResults: response.data.nodes });
      }
    } catch (error) {
      set({ error: 'Failed to search nodes' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteNode: async (nodeId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.deleteNode(nodeId);
      
      if (response.success) {
        set((state) => ({
          nodes: state.nodes.filter(node => node._id !== nodeId),
          relations: state.relations.filter(relation => 
            relation.sourceNodeId !== nodeId && relation.targetNodeId !== nodeId
          ),
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete node' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (file) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.uploadDocument(file);
      
      if (response.success && response.data) {
        set((state) => ({
          nodes: [...state.nodes, ...response.data!.nodes],
          relations: [...state.relations, ...response.data!.relations],
        }));
        
        return {
          summary: response.data.summary,
          nodesCount: response.data.nodesCount,
          relationsCount: response.data.relationsCount,
        };
      }
      return null;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to upload document' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
