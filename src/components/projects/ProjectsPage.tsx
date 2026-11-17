'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, LayoutGroup, type Variants } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  MoreVertical,
  Trash2,
  Clock,
  ListTodo,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectMember {
  id: string;
  name: string;
  avatar: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  color: string;
  icon: string | null;
  progress: number;
  createdAt: string;
  creator: { id: string; name: string; avatar: string | null };
  _count: { members: number; tasks: number };
  // members is not returned from the list endpoint, we just have the count
}

interface ProjectsResponse {
  projects: Project[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
];

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  PAUSED: {
    label: 'Paused',
    bg: 'bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-400',
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'bg-gray-500/15',
    text: 'text-gray-700 dark:text-gray-400',
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const setPage = useAppStore((s) => s.setPage);
  const setSelectedProjectId = useAppStore((s) => s.setSelectedProjectId);
  const user = useAppStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const {
    data: projectsData,
    isLoading,
    isError,
    error,
  } = useQuery<ProjectsResponse>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const projects = projectsData?.projects ?? [];

  // ── Mutations ───────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string;
      color: string;
      status: string;
    }) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create project');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete project');
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormColor(PRESET_COLORS[0]);
    setFormStatus('ACTIVE');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);
    await createMutation.mutateAsync({
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      color: formColor,
      status: formStatus,
    });
    setIsSubmitting(false);
  };

  const handleProjectClick = (projectId: string) => {
    // Navigate to tasks page with project filter
    setSelectedProjectId(projectId);
    setPage('tasks');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          {projects.length > 0 && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {projects.length}
            </Badge>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && <ProjectsGridSkeleton />}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Failed to load projects'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ['projects'] })
            }
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center"
        >
          <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <FolderKanban className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Create your first project to start organizing tasks and
            collaborating with your team.
          </p>
          <Button className="mt-6" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create your first project
          </Button>
        </motion.div>
      )}

      {/* Project Grid */}
      {!isLoading && !isError && projects.length > 0 && (
        <LayoutGroup>
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onClick={() => handleProjectClick(project.id)}
                  onDelete={() => setDeleteId(project.id)}
                  formatDate={formatDate}
                  getInitials={getInitials}
                  user={user}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your work.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="e.g. Website Redesign"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                placeholder="Brief description of the project..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'size-7 rounded-full transition-all',
                      formColor === color
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={formStatus}
                onValueChange={setFormStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!formName.trim() || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete the project and all
              its tasks. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Project Card ────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  index,
  onClick,
  onDelete,
  formatDate,
  getInitials,
  user,
}: {
  project: Project;
  index: number;
  onClick: () => void;
  onDelete: () => void;
  formatDate: (d: string) => string;
  getInitials: (n: string) => string;
  user: any;
}) {
  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.ACTIVE;

  // Generate fake member avatars from count (the list API doesn't return member details)
  const memberPlaceholders = useMemo(() => {
    const names = [
      user?.name || 'You',
      'Alex M.',
      'Sarah K.',
      'James L.',
      'Emily R.',
      'David C.',
    ];
    return Array.from(
      { length: Math.min(project._count.members, 4) },
      (_, i) => names[i] || `Member ${i + 1}`
    );
  }, [project._count.members, user?.name]);

  return (
    <motion.div
      layout
      layoutId={project.id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* Color top bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: project.color }}
      />

      <div className="flex flex-col gap-3 p-4 pt-3.5">
        {/* Top row: status + menu */}
        <div className="flex items-start justify-between">
          <Badge
            variant="secondary"
            className={cn('text-[11px] font-medium', statusCfg.bg, statusCfg.text)}
          >
            {statusCfg.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Name & Description */}
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-tight line-clamp-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        {/* Footer: members, tasks, date */}
        <div className="flex items-center justify-between pt-1">
          {/* Stacked avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {memberPlaceholders.map((name, i) => (
                <div
                  key={i}
                  className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium"
                  title={name}
                >
                  {getInitials(name)}
                </div>
              ))}
              {project._count.members > 4 && (
                <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium">
                  +{project._count.members - 4}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListTodo className="size-3" />
              {project._count.tasks} {project._count.tasks === 1 ? 'task' : 'tasks'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <Skeleton className="h-1 w-full" />
          <div className="flex flex-col gap-3 p-4 pt-3.5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="size-7 rounded-md" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <Skeleton className="size-6 rounded-full border-2 border-background" />
                <Skeleton className="size-6 rounded-full border-2 border-background" />
                <Skeleton className="size-6 rounded-full border-2 border-background" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}