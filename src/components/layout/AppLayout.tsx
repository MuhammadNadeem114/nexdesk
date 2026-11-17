'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { AppSidebar, SidebarContent } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileMenuClick = useCallback(() => {
    setMobileOpen(true);
  }, []);

  // Close mobile sheet on page change
  const currentPage = useAppStore((s) => s.currentPage);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile nav on navigation
    setMobileOpen(false);
  }, [currentPage]);

  // Close mobile sheet on resize to desktop
  useEffect(() => {
    if (!isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile nav on desktop resize
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-slot="app-header"] input[type="search"]'
        );
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main content area */}
      <motion.main
        data-slot="app-main"
        className="flex flex-1 flex-col overflow-hidden"
        animate={{
          marginLeft: isMobile ? 0 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <AppHeader onMobileMenuClick={handleMobileMenuClick} />

        <motion.div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}