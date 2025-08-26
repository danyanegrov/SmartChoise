import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ToastNotification, ThemeConfig } from '@/types';

interface UIState {
  theme: ThemeConfig;
  sidebarOpen: boolean;
  toasts: ToastNotification[];
  loading: Record<string, boolean>;
  currentScreen: string;
  progress: Record<string, number>;
}

interface UIActions {
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setCurrentScreen: (screen: string) => void;
  setProgress: (key: string, progress: number) => void;
  clearProgress: (key: string) => void;
}

const defaultTheme: ThemeConfig = {
  mode: 'light',
  primaryColor: '#20808d',
  secondaryColor: '#5e5240',
  borderRadius: 8,
  fontSize: 'medium'
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      // State
      theme: defaultTheme,
      sidebarOpen: false,
      toasts: [],
      loading: {},
      currentScreen: 'home',
      progress: {},

      // Actions
      setTheme: (themeUpdates: Partial<ThemeConfig>) => {
        const { theme } = get();
        set({ theme: { ...theme, ...themeUpdates } });
      },

      toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      addToast: (toast: Omit<ToastNotification, 'id'>) => {
        const { toasts } = get();
        const newToast: ToastNotification = {
          ...toast,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        
        set({ toasts: [...toasts, newToast] });

        // Auto remove toast after duration
        const duration = toast.duration || 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(newToast.id);
          }, duration);
        }
      },

      removeToast: (id: string) => {
        const { toasts } = get();
        set({ toasts: toasts.filter(toast => toast.id !== id) });
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      setLoading: (key: string, loading: boolean) => {
        const { loading: currentLoading } = get();
        if (loading) {
          set({ loading: { ...currentLoading, [key]: true } });
        } else {
          const { [key]: removed, ...rest } = currentLoading;
          set({ loading: rest });
        }
      },

      setCurrentScreen: (screen: string) => {
        set({ currentScreen: screen });
      },

      setProgress: (key: string, progress: number) => {
        const { progress: currentProgress } = get();
        set({ progress: { ...currentProgress, [key]: Math.max(0, Math.min(100, progress)) } });
      },

      clearProgress: (key: string) => {
        const { progress: currentProgress } = get();
        const { [key]: removed, ...rest } = currentProgress;
        set({ progress: rest });
      }
    }),
    {
      name: 'smartchoice-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);
