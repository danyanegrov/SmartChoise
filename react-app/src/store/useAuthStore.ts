import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, UserProfile } from '@/types';

interface AuthActions {
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
  setDemo: (isDemo: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isDemo: false,
      loading: false,
      error: null,

      // Actions
      login: (user: UserProfile, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isDemo: false,
          error: null
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isDemo: false,
          error: null
        });
      },

      setUser: (user: UserProfile) => {
        set({ user });
      },

      setDemo: (isDemo: boolean) => {
        set({
          isDemo,
          isAuthenticated: isDemo,
          user: isDemo ? {
            id: 'demo-user',
            email: 'demo@example.com',
            name: 'Демо Пользователь',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } : null
        });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'smartchoice-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isDemo: state.isDemo
      })
    }
  )
);
