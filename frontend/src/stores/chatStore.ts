import { create } from 'zustand';
import { ChatSession, ChatMessage, ChatRequest, ChatResponse } from '../types';
import { apiClient } from '../lib/api';
import { socketManager } from '../lib/socket';

interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  
  // Actions
  setCurrentSession: (session: ChatSession | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTyping: (typing: boolean) => void;
  
  // API calls
  createSession: (title?: string) => Promise<ChatSession | null>;
  loadSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (request: ChatRequest) => Promise<ChatResponse | null>;
  
  // Real-time updates
  initializeSocket: () => void;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  isTyping: false,

  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setTyping: (typing) => set({ isTyping: typing }),

  createSession: async (title) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.createSession(title);
      
      if (response.success && response.data) {
        const newSession: ChatSession = {
          id: response.data.sessionId,
          title: response.data.title,
          messages: [],
          createdAt: response.data.createdAt,
          updatedAt: response.data.createdAt,
        };
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
        }));
        
        return newSession;
      }
      return null;
    } catch (error) {
      set({ error: 'Failed to create session' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  loadSessions: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getSessions();
      
      if (response.success && response.data) {
        set({ sessions: response.data.sessions });
      }
    } catch (error) {
      set({ error: 'Failed to load sessions' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSession: async (sessionId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getSession(sessionId);
      
      if (response.success && response.data) {
        set({ currentSession: response.data });
        get().joinSession(sessionId);
      }
    } catch (error) {
      set({ error: 'Failed to load session' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSession: async (sessionId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.deleteSession(sessionId);
      
      if (response.success) {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        }));
        
        if (get().currentSession?.id === sessionId) {
          get().leaveSession(sessionId);
        }
      }
    } catch (error) {
      set({ error: 'Failed to delete session' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (request) => {
    try {
      set({ isLoading: true, error: null });
      
      // Add user message to current session
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: request.message,
        timestamp: new Date().toISOString(),
      };

      set((state) => {
        if (state.currentSession) {
          return {
            currentSession: {
              ...state.currentSession,
              messages: [...state.currentSession.messages, userMessage],
            },
          };
        }
        return {};
      });

      const response = await apiClient.sendMessage(request);
      
      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString(),
          metadata: response.data.metadata,
        };

        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                messages: [...state.currentSession.messages, assistantMessage],
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return {};
        });

        return response.data;
      }
      return null;
    } catch (error) {
      set({ error: 'Failed to send message' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  initializeSocket: () => {
    const socket = socketManager.connect();
    
    socket.on('message', (data) => {
      // Handle real-time messages if needed
      console.log('Received message:', data);
    });

    socket.on('typing', (data) => {
      set({ isTyping: data.isTyping });
    });
  },

  joinSession: (sessionId) => {
    socketManager.joinSession(sessionId);
  },

  leaveSession: (sessionId) => {
    socketManager.leaveSession(sessionId);
  },
}));
