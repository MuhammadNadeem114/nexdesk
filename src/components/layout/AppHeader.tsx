'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAppStore, type Page } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const pageLabels: Record<Page, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  team: 'Team',
  chat: 'Chat',
  ai: 'AI Assistant',
  analytics: 'Analytics',
  files: 'Files',
  calendar: 'Calendar',
  settings: 'Settings',
};

function ThemeIcon({ theme }: { theme: 'light' | 'dark' | 'system' }) {
  const resolved = (() => {
    if (theme === 'system') {
      return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  })();

  return resolved === 'dark' ? (
    <Moon className="size-4" />
  ) : (
    <Sun className="size-4" />
  );
}

export function AppHeader({ onMobileMenuClick }: { onMobileMenuClick?: () => void }) {
  const {
    currentPage,
    theme,
    user,
    unreadCount,
    setTheme,
    setPage,
  } = useAppStore();

  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ND';

  const userName = user?.name ?? 'NexDesk User';

  const handleThemeToggle = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const currentLabel = pageLabels[currentPage];

  return (
    <motion.header
      data-slot="app-header"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6"
    >
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuClick}
          aria-label="Open menu"
          className="shrink-0"
        >
          <Menu className="size-5" />
        </Button>
      )}

      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage('dashboard');
              }}
            >
              NexDesk
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile page title */}
      {isMobile && (
        <span className="text-sm font-semibold text-foreground">
          {currentLabel}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden max-w-xs flex-1 sm:flex">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-8 w-full rounded-lg border-border/60 bg-muted/50 pl-8 pr-12 text-sm transition-colors focus-visible:bg-background"
          aria-label="Search"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline-block">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Mobile search button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="text-muted-foreground"
        >
          <Search className="size-4" />
        </Button>
      )}

      {/* Theme toggle */}
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          aria-label={`Current theme: ${theme}. Click to switch.`}
          className="text-muted-foreground"
        >
          <ThemeIcon theme={theme} />
        </Button>
      )}

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPage('settings')}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative text-muted-foreground"
      >
        <Bell className="size-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="notif-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* User avatar */}
      <div className="flex items-center gap-2">
        <Avatar className="size-8 ring-1 ring-border">
          <AvatarImage src={user?.image} alt={userName} />
          <AvatarFallback className="text-xs font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium text-foreground md:inline-block">
          {userName}
        </span>
      </div>
    </motion.header>
  );
}