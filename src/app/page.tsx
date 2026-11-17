'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { LoginPage } from '@/components/auth/LoginPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { TasksPage } from '@/components/tasks/TasksPage';
import { TeamPage } from '@/components/team/TeamPage';
import { ChatPage } from '@/components/chat/ChatPage';
import { AiAssistantPage } from '@/components/ai/AiAssistantPage';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';
import { FilesPage } from '@/components/files/FilesPage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { SettingsPage } from '@/components/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading, setAuth, setIsAuthLoading, setPage } = useAppStore();

  useEffect(() => {
    // Skip session check if user is already authenticated (e.g. just logged in)
    if (useAppStore.getState().isAuthenticated) return;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setAuth(data.user);
            return;
          }
        }
      } catch {
        // Not authenticated
      }
      setIsAuthLoading(false);
      setPage('login');
    };
    checkSession();
  }, [setAuth, setIsAuthLoading, setPage]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading NexDesk AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function PageRouter() {
  const currentPage = useAppStore((s) => s.currentPage);

  if (currentPage === 'login') return <LoginPage />;
  if (currentPage === 'register') return <RegisterPage />;

  return (
    <AuthGate>
      <AppLayout>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'projects' && <ProjectsPage />}
        {currentPage === 'tasks' && <TasksPage />}
        {currentPage === 'team' && <TeamPage />}
        {currentPage === 'chat' && <ChatPage />}
        {currentPage === 'ai' && <AiAssistantPage />}
        {currentPage === 'analytics' && <AnalyticsPage />}
        {currentPage === 'files' && <FilesPage />}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </AppLayout>
    </AuthGate>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <PageRouter />
    </QueryClientProvider>
  );
}