import { create } from 'zustand';

export type Page =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'team'
  | 'chat'
  | 'ai'
  | 'analytics'
  | 'files'
  | 'calendar'
  | 'settings';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: any | null;
  isAuthLoading: boolean;

  // Navigation
  currentPage: Page;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Notifications
  notifications: any[];
  unreadCount: number;

  // Chat
  activeChannelId: string | null;

  // Tasks
  taskView: 'kanban' | 'table' | 'calendar';
  selectedProjectId: string | null;

  // Actions
  setIsAuthLoading: (loading: boolean) => void;
  setAuth: (user: any) => void;
  logout: () => void;
  setPage: (page: Page) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setNotifications: (notifications: any[]) => void;
  setActiveChannel: (id: string | null) => void;
  setTaskView: (view: 'kanban' | 'table' | 'calendar') => void;
  setSelectedProjectId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth defaults
  isAuthenticated: false,
  user: null,
  isAuthLoading: true,

  // Navigation defaults
  currentPage: 'dashboard',
  sidebarCollapsed: false,

  // Theme default
  theme: 'system',

  // Notifications defaults
  notifications: [],
  unreadCount: 0,

  // Chat default
  activeChannelId: null,

  // Tasks default
  taskView: 'kanban',
  selectedProjectId: null,

  // Actions
  setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),

  setAuth: (user) =>
    set({
      isAuthenticated: true,
      user,
      isAuthLoading: false,
    }),

  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    set({
      isAuthenticated: false,
      user: null,
      currentPage: 'dashboard',
      activeChannelId: null,
      notifications: [],
      unreadCount: 0,
    });
  },

  setPage: (page) => set({ currentPage: page }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme) => {
    set({ theme });
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      }
    } else {
      root.classList.add(theme);
    }
  },

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n: any) => !n.read).length,
    }),

  setActiveChannel: (id) => set({ activeChannelId: id }),

  setTaskView: (view) => set({ taskView: view }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
}));