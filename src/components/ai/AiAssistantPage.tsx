'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Plus,
  Sparkles,
  MessageSquare,
  Bot,
  Menu,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppStore } from '@/lib/store';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AiConversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-3 px-4 py-3"
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border bg-card px-4 py-3 shadow-sm">
        <motion.span
          className="size-2 rounded-full bg-muted-foreground/50"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: 0,
            ease: 'easeInOut',
          }}
        />
        <motion.span
          className="size-2 rounded-full bg-muted-foreground/50"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: 0.15,
            ease: 'easeInOut',
          }}
        />
        <motion.span
          className="size-2 rounded-full bg-muted-foreground/50"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: 0.3,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── Suggestion Chips ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Plan my sprint', icon: '📋' },
  { label: 'Generate a report', icon: '📊' },
  { label: 'Help me write an email', icon: '✉️' },
  { label: 'Summarize my tasks', icon: '✅' },
];

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-full flex-col items-center justify-center px-6"
    >
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="size-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">Start a conversation</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        Ask me anything about your projects, tasks, or team. I can help you plan,
        analyze, and get things done faster.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestionClick(s.label)}
            className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <span>{s.icon}</span>
            {s.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── AI Message Bubble ──────────────────────────────────────────────────────

function AiMessageBubble({
  message,
  index,
}: {
  message: AiMessage;
  index: number;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 px-4 py-2 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* AI avatar */}
      {!isUser && (
        <Avatar className="mt-1 size-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            AI
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : 'rounded-tl-md border bg-card text-foreground'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Conversation List Item ─────────────────────────────────────────────────

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: AiConversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <MessageSquare className="mt-0.5 size-4 shrink-0 opacity-60" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{conversation.title}</p>
        <p className="mt-0.5 text-[11px] opacity-60">
          {formatDate(conversation.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ─── Main AI Assistant Page ─────────────────────────────────────────────────

export function AiAssistantPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.user);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<AiConversation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Fetch conversations list ──
  // We'll use a simple fetch since the API doesn't have a GET for conversations
  // Instead we'll manage conversations locally as they're created
  const { data: conversationsData, isLoading: convLoading } = useQuery<{
    conversations: AiConversation[];
  }>({
    queryKey: ['ai-conversations'],
    queryFn: () => fetch('/api/ai?list=true').then((r) => r.json()),
    retry: false,
    // This endpoint might not exist, so we handle it gracefully
  });

  useEffect(() => {
    if (conversationsData?.conversations) {
      setConversations(conversationsData.conversations);
    }
  }, [conversationsData]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Load conversation messages ──
  const loadConversation = useCallback(async (convId: string) => {
    setActiveConversationId(convId);
    setMessages([]);
    try {
      const res = await fetch(`/api/ai?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ── New Chat ──
  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    if (isMobile) setShowSidebar(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [isMobile]);

  // ── Send message ──
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: AiMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      conversationId: activeConversationId || '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationId: activeConversationId || undefined,
        }),
      });

      const data = await res.json();

      if (data.message) {
        const aiMessage: AiMessage = {
          id: data.message.id || `ai-${Date.now()}`,
          role: 'assistant',
          content: data.message.content,
          conversationId: data.conversationId,
          createdAt: data.message.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }

      // If this was a new conversation, update the ID and add to list
      if (data.conversationId && !activeConversationId) {
        setActiveConversationId(data.conversationId);
        const newConv: AiConversation = {
          id: data.conversationId,
          title: data.conversationTitle || trimmed.slice(0, 50),
          model: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
      }
    } catch {
      const errorMessage: AiMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        conversationId: activeConversationId || '',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [input, isLoading, activeConversationId]);

  // ── Suggestion click ──
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    []
  );

  // ── Keyboard handler ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Delete conversation from list ──
  const handleDeleteConversation = useCallback(
    (convId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    [activeConversationId]
  );

  return (
    <div className="flex h-full">
      {/* ── Conversation List (Left Panel) ── */}
      <AnimatePresence>
        {(showSidebar || !isMobile) && (
          <motion.aside
            initial={isMobile ? { x: -260 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -260 } : undefined}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex w-[260px] shrink-0 flex-col border-r bg-muted/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">AI Assistant</h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleNewChat}
                >
                  <Plus className="size-4" />
                </Button>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setShowSidebar(false)}
                  >
                    <PanelLeftClose className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {convLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-2">
                      <Skeleton className="size-4 rounded" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No conversations yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Start a new chat to begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5 p-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="group/conv relative"
                    >
                      <ConversationItem
                        conversation={conv}
                        isActive={activeConversationId === conv.id}
                        onClick={() => {
                          loadConversation(conv.id);
                          if (isMobile) setShowSidebar(false);
                        }}
                      />
                      {/* Delete button on hover */}
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover/conv:flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label="Delete conversation"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Chat Area (Right Panel) ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="size-4" />
            </Button>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowSidebar((v) => !v)}
            >
              {showSidebar ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeft className="size-4" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">AI Assistant</h2>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bot className="size-3.5" />
            <span>GPT-4o</span>
          </div>
        </div>

        {/* Messages or Empty State */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="py-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <AiMessageBubble key={msg.id} message={msg} index={i} />
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
              <Textarea
                ref={textareaRef}
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[36px] max-h-40 flex-1 resize-none border-0 bg-transparent p-1.5 pl-2 shadow-none focus-visible:ring-0 text-sm"
                rows={1}
              />
              <Button
                size="icon"
                className="size-8 shrink-0 rounded-lg"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
              AI responses may not always be accurate. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}