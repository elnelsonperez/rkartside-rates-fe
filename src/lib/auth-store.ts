import { create } from 'zustand';
import { supabase } from './supabase';
import type { User } from '../types';
import type { Store } from './api';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  currentStore: Store | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setIsAdmin: (isAdmin: boolean) => void;
  setCurrentStore: (store: Store | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAdmin: false,
  currentStore: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });

    try {
      // Check current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          },
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }

    // Subscribe to auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          },
        });
      } else {
        set({
          user: null,
          isAdmin: false,
          currentStore: null,
        });
      }

      set({ isLoading: false });
    });
  },

  setIsAdmin: isAdmin => {
    set({ isAdmin });
  },

  setCurrentStore: store => {
    set({ currentStore: store });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local state
    set({
      user: null,
      isAdmin: false,
      currentStore: null,
    });
  },
}));
