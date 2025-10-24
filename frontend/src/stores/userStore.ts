import { create } from 'zustand';
import { User, ApiKey } from '../types';
import { apiClient } from '../lib/api';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API calls
  register: (email: string, name: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  addApiKey: (provider: string, key: string, model?: string, baseUrl?: string) => Promise<boolean>;
  updateApiKey: (keyId: string, updates: Partial<ApiKey>) => Promise<boolean>;
  deleteApiKey: (keyId: string) => Promise<boolean>;
  
  // Utility
  initializeAuth: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  register: async (email, name, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.register(email, name, password);
      
      if (response.success && response.data) {
        localStorage.setItem('authToken', response.data.token);
        set({
          user: response.data.user,
          isAuthenticated: true,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Registration failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('authToken', response.data.token);
        set({
          user: response.data.user,
          isAuthenticated: true,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Login failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
        });
      } else {
        get().logout();
      }
    } catch (error) {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  addApiKey: async (provider, key, model, baseUrl) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.addApiKey(provider, key, model, baseUrl);
      
      if (response.success && response.data) {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            apiKeys: [...state.user.apiKeys, response.data!.apiKey],
          } : null,
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to add API key' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateApiKey: async (keyId, updates) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.updateApiKey(keyId, updates);
      
      if (response.success && response.data) {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            apiKeys: state.user.apiKeys.map(key => 
              key.id === keyId ? { ...key, ...response.data!.apiKey } : key
            ),
          } : null,
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update API key' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteApiKey: async (keyId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.deleteApiKey(keyId);
      
      if (response.success) {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            apiKeys: state.user.apiKeys.filter(key => key.id !== keyId),
          } : null,
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete API key' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  initializeAuth: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      get().loadProfile();
    }
  },
}));
