'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  MessageSquare,
  Sparkles,
  BarChart3,
  FileText,
  CalendarDays,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAppStore, type Page } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'chat', label: 'Chat', icon: MessageSquare, showBadge: true },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function SidebarContent() {
  const {
    currentPage,
    sidebarCollapsed,
    user,
    unreadCount,
    setPage,
    toggleSidebar,
    logout,
  } = useAppStore();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ND';

  const userName = user?.name ?? 'NexDesk User';
  const userEmail = user?.email ?? 'user@nexdesk.ai';

  return (
    <div className="flex h-full flex-col">
      {/* Logo Area */}
      <div className="flex h-14 items-center px-3">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-foreground">
                  NexDesk
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[10px] font-semibold tracking-wide uppercase"
                >
                  AI
                </Badge>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto flex size-8 items-center justify-center rounded-lg bg-primary"
            >
              <Sparkles className="size-4 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator />

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3"
        aria-label="Main navigation"
      >
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            const button = (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => setPage(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative h-9 w-full justify-start gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    isActive ? 'text-primary-foreground' : 'text-current'
                  )}
                />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      key={`label-${item.id}`}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!sidebarCollapsed && item.showBadge && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </Button>
            );

            if (sidebarCollapsed) {
              return (
                <li key={item.id} className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      <span className="font-medium">{item.label}</span>
                      {item.showBadge && unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-1.5">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  {/* Collapsed badge indicator */}
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -right-0.5 top-1 flex size-2 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </li>
              );
            }

            return <li key={item.id}>{button}</li>;
          })}
        </ul>
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-2.5">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-2 py-1">
                <Avatar className="size-8 ring-2 ring-primary/20">
                  <AvatarImage src={user?.image} alt={userName} />
                  <AvatarFallback className="text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  aria-label="Log out"
                  className="size-7 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              <p className="font-medium">{userName}</p>
              <p className="text-xs opacity-70">{userEmail}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-accent"
          >
            <Avatar className="size-8 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={user?.image} alt={userName} />
              <AvatarFallback className="text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Log out"
                className="size-7 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-3.5" />
              </Button>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      data-slot="app-sidebar"
      className="relative z-30 flex h-screen flex-col border-r border-border bg-background"
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      aria-label="Application sidebar"
    >
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-16 z-40 size-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent"
      >
        {sidebarCollapsed ? (
          <PanelLeft className="size-3" />
        ) : (
          <PanelLeftClose className="size-3" />
        )}
      </Button>

      <SidebarContent />
    </motion.aside>
  );
}

// Exported for use inside the mobile Sheet
export { SidebarContent };