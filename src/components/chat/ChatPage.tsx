'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Lock,
  MessageCircle,
  Plus,
  Send,
  Paperclip,
  Pin,
  PanelLeftClose,
  PanelLeft,
  Users,
  Menu,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';

interface Channel {
  id: string;
  name: string;
  type: string;
  description: string | null;
  memberCount: number;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  channelId: string;
  senderId: string;
  isPinned: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size: number | null;
    mimeType: string | null;
  }>;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getChannelIcon(type: string) {
  switch (type) {
    case 'PRIVATE':
      return <Lock className="size-3.5" />;
    case 'DM':
      return <MessageCircle className="size-3.5" />;
    default:
      return <Hash className="size-3.5" />;
  }
}

function shouldGroupMessages(
  current: Message,
  previous: Message | null
): boolean {
  if (!previous) return false;
  if (current.senderId !== previous.senderId) return false;
  if (current.type === 'SYSTEM' || previous.type === 'SYSTEM') return false;
  const gap =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime();
  return gap < 5 * 60 * 1000; // 5 minutes
}

// ─── New Channel Dialog ─────────────────────────────────────────────────────

function NewChannelDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (channel: Channel) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          channelType: type,
        }),
      });
      const data = await res.json();
      if (data.channel) {
        onCreated(data.channel);
        setName('');
        setDescription('');
        setType('PUBLIC');
        onOpenChange(false);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription>
            Channels are where your team communicates. They&apos;re best organized
            around a topic.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Name</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {type === 'PRIVATE' ? (
                  <Lock className="size-4" />
                ) : (
                  <Hash className="size-4" />
                )}
              </span>
              <Input
                id="channel-name"
                placeholder="e.g. project-updates"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-desc">Description (optional)</Label>
            <Input
              id="channel-desc"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Channel Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <span className="flex items-center gap-2">
                    <Hash className="size-3.5" /> Public
                  </span>
                </SelectItem>
                <SelectItem value="PRIVATE">
                  <span className="flex items-center gap-2">
                    <Lock className="size-3.5" /> Private
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === 'PUBLIC'
                ? 'Anyone in the organization can view and join this channel.'
                : 'Only invited members can see this channel.'}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Message Item ───────────────────────────────────────────────────────────

function MessageItem({
  message,
  showHeader,
  isNextGrouped,
}: {
  message: Message;
  showHeader: boolean;
  isNextGrouped: boolean;
}) {
  // System message
  if (message.type === 'SYSTEM') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center py-2"
      >
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-3 px-4 py-0.5 hover:bg-muted/30 transition-colors ${
        isNextGrouped ? '' : 'pt-3'
      }`}
    >
      {/* Avatar - hidden for grouped messages */}
      <div className="w-8 shrink-0">
        {showHeader && (
          <Avatar className="size-8">
            <AvatarImage
              src={message.sender.avatar || undefined}
              alt={message.sender.name || 'User'}
            />
            <AvatarFallback className="text-xs">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* Header row */}
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">
              {message.sender.name || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {message.isPinned && (
              <Pin className="size-3 text-amber-500" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex items-start gap-2">
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
          {message.isPinned && !showHeader && (
            <Pin className="mt-0.5 size-3 shrink-0 text-amber-500/60" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Chat Page ─────────────────────────────────────────────────────────

export function ChatPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const activeChannelId = useAppStore((s) => s.activeChannelId);
  const setActiveChannel = useAppStore((s) => s.setActiveChannel);
  const currentUser = useAppStore((s) => s.user);

  const [messageInput, setMessageInput] = useState('');
  const [showChannelList, setShowChannelList] = useState(true);
  const [newChannelOpen, setNewChannelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Queries ──
  const {
    data: channelsData,
    isLoading: channelsLoading,
  } = useQuery<{ channels: Channel[] }>({
    queryKey: ['chat-channels'],
    queryFn: () => fetch('/api/chat').then((r) => r.json()),
  });

  const channels = channelsData?.channels || [];

  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery<{ messages: Message[] }>({
    queryKey: ['chat-messages', activeChannelId],
    queryFn: () =>
      fetch(`/api/chat?channelId=${activeChannelId}`).then((r) => r.json()),
    enabled: !!activeChannelId,
  });

  const messages = messagesData?.messages || [];

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // ── Set first channel on mount ──
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannel(channels[0].id);
    }
  }, [channels, activeChannelId, setActiveChannel]);

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Mobile: toggle channel list ──
  const handleChannelSelect = useCallback(
    (id: string) => {
      setActiveChannel(id);
      if (isMobile) setShowChannelList(false);
    },
    [setActiveChannel, isMobile]
  );

  // ── Send Message Mutation ──
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannelId, content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeChannelId] });
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      setMessageInput('');
      // Refocus textarea
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
  });

  const handleSend = () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !activeChannelId) return;
    sendMessage.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChannel = (channel: Channel) => {
    queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    setActiveChannel(channel.id);
  };

  // ── Group messages ──
  const groupedMessages = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;
      return {
        message: msg,
        showHeader: !shouldGroupMessages(msg, prev),
        isNextGrouped: shouldGroupMessages(next ?? ({} as Message), msg),
      };
    });
  }, [messages]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full">
      {/* ── Channel List (Left Panel) ── */}
      <AnimatePresence>
        {(showChannelList || !isMobile) && (
          <motion.aside
            initial={isMobile ? { x: -280 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -280 } : undefined}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex w-[280px] shrink-0 flex-col border-r bg-muted/20"
          >
            {/* Channel List Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Channels</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setNewChannelOpen(true)}
                >
                  <Plus className="size-4" />
                </Button>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setShowChannelList(false)}
                  >
                    <PanelLeftClose className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Channel List */}
            <ScrollArea className="flex-1">
              {channelsLoading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-2">
                      <Skeleton className="size-4 rounded" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : channels.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No channels yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-0.5 p-2">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel.id)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                        activeChannelId === channel.id
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="shrink-0">
                        {getChannelIcon(channel.type)}
                      </span>
                      <span className="truncate flex-1">{channel.name}</span>
                      {channel.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="size-5 justify-center rounded-full p-0 text-[10px]"
                        >
                          {channel.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Message Area (Right Panel) ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!activeChannelId ? (
          /* No channel selected */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Hash className="size-12 opacity-30" />
            <p className="text-sm">
              {channelsLoading
                ? 'Loading channels...'
                : 'Select a channel to start chatting'}
            </p>
          </div>
        ) : (
          <>
            {/* Message Area Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              {/* Mobile menu toggle */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShowChannelList(true)}
                >
                  <Menu className="size-4" />
                </Button>
              )}

              {/* Desktop: collapse channel list */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShowChannelList((v) => !v)}
                >
                  {showChannelList ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeft className="size-4" />
                  )}
                </Button>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {getChannelIcon(activeChannel?.type || 'PUBLIC')}
                  </span>
                  <h2 className="text-sm font-semibold truncate">
                    {activeChannel?.name}
                  </h2>
                  {activeChannel?.type === 'PRIVATE' && (
                    <Badge variant="secondary" className="text-[10px]">
                      Private
                    </Badge>
                  )}
                </div>
                {activeChannel?.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activeChannel.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                <span>{activeChannel?.memberCount || 0}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messagesLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="size-8 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                      <Hash className="size-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium">
                      No messages yet
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Start the conversation in #{activeChannel?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {groupedMessages.map(({ message, showHeader, isNextGrouped }) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      showHeader={showHeader}
                      isNextGrouped={isNextGrouped}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-end gap-2 rounded-lg border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/20">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  type="button"
                  aria-label="Attach file"
                >
                  <Paperclip className="size-4" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  placeholder={`Message #${activeChannel?.name || 'channel'}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[36px] max-h-32 flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendMessage.isPending}
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Channel Dialog */}
      <NewChannelDialog
        open={newChannelOpen}
        onOpenChange={setNewChannelOpen}
        onCreated={handleNewChannel}
      />
    </div>
  );
}