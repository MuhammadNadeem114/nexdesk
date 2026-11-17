'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  LayoutGrid,
  Table2,
  CalendarDays,
  X,
  Clock,
  MessageSquare,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast, isToday, parseISO } from 'date-fns';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'CANCELLED';

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface TaskLabel {
  id: string;
  name: string;
  color: string;
  taskId: string;
}

interface TaskAssignee {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface TaskProject {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  order: number;
  startDate: string | null;
  dueDate: string | null;
  estimateHours: number | null;
  loggedHours: number;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  project: TaskProject;
  assignee: TaskAssignee | null;
  creator: TaskAssignee;
  labels: TaskLabel[];
  _count: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

interface TasksResponse {
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string;
  };
}

interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  author?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: {
  id: TaskStatus;
  label: string;
  color: string;
  dotColor: string;
}[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-gray-500', dotColor: 'bg-gray-400' },
  { id: 'TODO', label: 'Todo', color: 'bg-slate-500', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500', dotColor: 'bg-blue-400' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-amber-500', dotColor: 'bg-amber-400' },
  { id: 'DONE', label: 'Done', color: 'bg-emerald-500', dotColor: 'bg-emerald-400' },
  { id: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500', dotColor: 'bg-red-400' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  LOW: { label: 'Low', color: 'text-gray-500', border: 'border-l-gray-400' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
  HIGH: { label: 'High', color: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-600 dark:text-red-400', border: 'border-l-red-500' },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  BACKLOG: { label: 'Backlog', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  TODO: { label: 'Todo', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  IN_REVIEW: { label: 'In Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  DONE: { label: 'Done', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return '';
  }
}

function formatFullDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
  } catch {
    return '';
  }
}

// ─── Kanban Task Card ────────────────────────────────────────────────────────

function KanbanTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      layoutId={`kanban-${task.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group cursor-pointer rounded-lg border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md',
        `border-l-[3px] ${priorityCfg.border}`,
        isDragging && 'shadow-lg'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <p className="text-[13px] font-medium leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>

      {/* Bottom meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {/* Subtask count */}
          {task._count.subtasks > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckSquare className="size-3" />
              {task._count.subtasks}
            </span>
          )}
          {/* Comment count */}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="size-3" />
              {task._count.comments}
            </span>
          )}
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-0.5',
                isOverdue(task.dueDate) && 'text-red-500 font-medium'
              )}
            >
              <Clock className="size-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
            {getInitials(task.assignee.name)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Drag Overlay Card ───────────────────────────────────────────────────────

function DragOverlayCard({ task }: { task: Task | null }) {
  if (!task) return null;
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;

  return (
    <div
      className={cn(
        'w-72 rounded-lg border bg-card p-2.5 shadow-xl rotate-2',
        `border-l-[3px] ${priorityCfg.border}`
      )}
    >
      {task.labels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-[13px] font-medium leading-snug line-clamp-2">
        {task.title}
      </p>
    </div>
  );
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: column.id,
    data: { type: 'column', status: column.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl bg-muted/40 transition-colors',
        isOver && 'bg-muted/70'
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={cn('size-2 rounded-full', column.dotColor)} />
        <h3 className="text-sm font-semibold">{column.label}</h3>
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1 px-2 pb-2">
        <div className="flex min-h-[calc(100vh-260px)] flex-col gap-2">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <KanbanTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
              No tasks
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TasksPage() {
  const queryClient = useQueryClient();
  const taskView = useAppStore((s) => s.taskView);
  const setTaskView = useAppStore((s) => s.setTaskView);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useAppStore((s) => s.setSelectedProjectId);
  const user = useAppStore((s) => s.user);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>(
    selectedProjectId ?? 'all'
  );
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  // ── Create form state ────────────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<string>('TODO');
  const [formPriority, setFormPriority] = useState<string>('MEDIUM');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formAssigneeId, setFormAssigneeId] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formEstimateHours, setFormEstimateHours] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── DnD state ────────────────────────────────────────────────────────────
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Sync project filter from store on mount / when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(selectedProjectId);
      // Clear it from the store after consuming it
      setSelectedProjectId(null);
    }
  }, [selectedProjectId, setSelectedProjectId]);

  // ── Queries ──────────────────────────────────────────────────────────────

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('projectId', projectFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    return params.toString();
  }, [projectFilter, statusFilter, priorityFilter]);

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
  } = useQuery<TasksResponse>({
    queryKey: ['tasks', projectFilter, statusFilter, priorityFilter],
    queryFn: () => {
      const qs = buildQueryParams();
      return fetch(`/api/tasks${qs ? `?${qs}` : ''}`).then((r) => r.json());
    },
  });

  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
    staleTime: 60_000,
  });

  const { data: teamData } = useQuery<{ members: TeamMember[] }>({
    queryKey: ['team'],
    queryFn: () => fetch('/api/team').then((r) => r.json()),
    staleTime: 60_000,
  });

  // Comments for the detail dialog
  const { data: commentsData } = useQuery<{ comments: TaskComment[] }>({
    queryKey: ['task-comments', detailTaskId],
    queryFn: () =>
      fetch(`/api/tasks?id=${detailTaskId}`).then((r) => r.json()),
    enabled: !!detailTaskId,
    staleTime: 10_000,
  });

  const tasks = tasksData?.tasks ?? [];
  const projects = projectsData?.projects ?? [];
  const members = teamData?.members ?? [];

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === detailTaskId) ?? null,
    [tasks, detailTaskId]
  );

  // ── Kanban column grouping ──────────────────────────────────────────────

  const kanbanColumns = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col.id, []);
    }
    for (const task of tasks) {
      const status = task.status as TaskStatus;
      if (map.has(status)) {
        map.get(status)!.push(task);
      }
    }
    return map;
  }, [tasks]);

  // ── Table sorting ────────────────────────────────────────────────────────

  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'priority': {
          const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          cmp = (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2);
          break;
        }
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) cmp = 0;
          else if (!a.dueDate) cmp = 1;
          else if (!b.dueDate) cmp = -1;
          else cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'createdAt':
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [tasks, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Task created');
      resetCreateForm();
      setCreateOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create task');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: { id: string; [key: string]: unknown }) => {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update task');
    },
  });

  // ── DnD handlers ────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Column auto-detect handled by closestCorners
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;

    // Determine the target status
    let targetStatus: string | null = null;

    // Check if dropped over a column directly
    const columnDef = KANBAN_COLUMNS.find((c) => c.id === over.id);
    if (columnDef) {
      targetStatus = columnDef.id;
    } else {
      // Dropped over a task — find its column
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask && overTask.status !== (tasks.find((t) => t.id === taskId)?.status)) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus) {
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask && currentTask.status !== targetStatus) {
        updateMutation.mutate({ id: taskId, status: targetStatus });
      }
    }
  };

  // ── Create form helpers ─────────────────────────────────────────────────

  const resetCreateForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormStatus('TODO');
    setFormPriority('MEDIUM');
    setFormProjectId(projectFilter !== 'all' ? projectFilter : '');
    setFormAssigneeId('');
    setFormDueDate('');
    setFormEstimateHours('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formProjectId) return;
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        status: formStatus,
        priority: formPriority,
        projectId: formProjectId,
        assigneeId: formAssigneeId || undefined,
        dueDate: formDueDate || undefined,
        estimateHours: formEstimateHours ? parseFloat(formEstimateHours) : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all';

  // ── Detail dialog edit state (inline) ───────────────────────────────────

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditDesc(selectedTask.description || '');
      setEditStatus(selectedTask.status);
      setEditPriority(selectedTask.priority);
      setEditAssigneeId(selectedTask.assigneeId || '');
      setEditDueDate(selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '');
      setEditMode(false);
      setCommentText('');
    }
  }, [selectedTask]);

  const handleSaveEdits = () => {
    if (!detailTaskId) return;
    updateMutation.mutate(
      {
        id: detailTaskId,
        title: editTitle,
        description: editDesc || null,
        status: editStatus,
        priority: editPriority,
        assigneeId: editAssigneeId || null,
        dueDate: editDueDate || null,
      },
      {
        onSuccess: () => {
          setEditMode(false);
          toast.success('Task updated');
        },
      }
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <Button onClick={() => {
          resetCreateForm();
          setCreateOpen(true);
        }} size="sm">
          <Plus className="size-4" />
          New Task
        </Button>
      </div>

      {/* View toggle + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup
          type="single"
          value={taskView}
          onValueChange={(v) => {
            if (v) setTaskView(v as typeof taskView);
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="kanban" className="gap-1.5">
            <LayoutGrid className="size-3.5" />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="table" className="gap-1.5">
            <Table2 className="size-3.5" />
            Table
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" className="gap-1.5">
            <CalendarDays className="size-3.5" />
            Calendar
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {KANBAN_COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && taskView === 'kanban' && <KanbanSkeleton />}
      {isLoading && taskView === 'table' && <TableSkeleton />}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Failed to load tasks'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ['tasks'] })
            }
          >
            Retry
          </Button>
        </div>
      )}

      {/* Calendar placeholder */}
      {!isLoading && !isError && taskView === 'calendar' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center"
        >
          <CalendarDays className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Calendar View</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Calendar view lets you see tasks on a timeline. Use Kanban or Table
            view for now.
          </p>
        </motion.div>
      )}

      {/* ═══ KANBAN VIEW ═══ */}
      {!isLoading && !isError && taskView === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="flex-1">
            <div className="flex gap-3 pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
              <LayoutGroup>
                {KANBAN_COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tasks={kanbanColumns.get(col.id) ?? []}
                    onTaskClick={(task) => setDetailTaskId(task.id)}
                  />
                ))}
              </LayoutGroup>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <DragOverlay dropAnimation={{ duration: 200 }}>
            <DragOverlayCard task={activeTask} />
          </DragOverlay>
        </DndContext>
      )}

      {/* ═══ TABLE VIEW ═══ */}
      {!isLoading && !isError && taskView === 'table' && (
        <div className="flex-1 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('title')}
                >
                  <span className="flex items-center gap-1">
                    Title
                    {sortField === 'title' &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      ))}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('status')}
                >
                  <span className="flex items-center gap-1">
                    Status
                    {sortField === 'status' &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      ))}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('priority')}
                >
                  <span className="flex items-center gap-1">
                    Priority
                    {sortField === 'priority' &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      ))}
                  </span>
                </TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('dueDate')}
                >
                  <span className="flex items-center gap-1">
                    Due Date
                    {sortField === 'dueDate' &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      ))}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No tasks found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
              <AnimatePresence>
                {sortedTasks.map((task) => {
                  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;
                  const statusBadge = STATUS_BADGE[task.status] ?? STATUS_BADGE.TODO;
                  return (
                    <motion.tr
                      key={task.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => setDetailTaskId(task.id)}
                    >
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-8 w-0.5 rounded-full shrink-0', priorityCfg.border.replace('border-l-', 'bg-'))} />
                          <span className="text-sm font-medium line-clamp-1">
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        <Badge variant="secondary" className={cn('text-[11px]', statusBadge.className)}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="p-2 align-middle">
                        <span className={cn('text-xs font-medium', priorityCfg.color)}>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="p-2 align-middle">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
                              {getInitials(task.assignee.name)}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {task.project.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        {task.dueDate ? (
                          <span
                            className={cn(
                              'text-xs',
                              isOverdue(task.dueDate) && 'text-red-500 font-medium'
                            )}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      )}

      {/* ═══ CREATE TASK DIALOG ═══ */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) resetCreateForm();
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a task to your project board.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="What needs to be done?"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Describe the task..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Project <span className="text-destructive">*</span>
              </Label>
              <Select value={formProjectId} onValueChange={setFormProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Assignee</Label>
              <Select value={formAssigneeId} onValueChange={setFormAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>
                      {m.user.name || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Estimate (hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={formEstimateHours}
                  onChange={(e) => setFormEstimateHours(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formTitle.trim() || !formProjectId || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ TASK DETAIL DIALOG ═══ */}
      <Dialog
        open={!!detailTaskId && !!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTaskId(null);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between pr-8">
                  {editMode ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold"
                    />
                  ) : (
                    <div className="flex flex-col gap-1">
                      <DialogTitle className="text-left">
                        {selectedTask.title}
                      </DialogTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Created {formatFullDate(selectedTask.createdAt)}</span>
                        <span>·</span>
                        <span>by {selectedTask.creator.name || 'Unknown'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Labels */}
                {selectedTask.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTask.labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  {editMode ? (
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                      placeholder="Add a description..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedTask.description || (
                        <span className="italic">No description</span>
                      )}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Edit fields grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    {editMode ? (
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KANBAN_COLUMNS.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'w-fit text-[11px]',
                          STATUS_BADGE[selectedTask.status]?.className
                        )}
                      >
                        {STATUS_BADGE[selectedTask.status]?.label ?? selectedTask.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    {editMode ? (
                      <Select value={editPriority} onValueChange={setEditPriority}>
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          PRIORITY_CONFIG[selectedTask.priority]?.color
                        )}
                      >
                        {PRIORITY_CONFIG[selectedTask.priority]?.label ?? selectedTask.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Assignee</Label>
                    {editMode ? (
                      <Select value={editAssigneeId || 'none'} onValueChange={setEditAssigneeId}>
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {members.map((m) => (
                            <SelectItem key={m.user.id} value={m.user.id}>
                              {m.user.name || m.user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {selectedTask.assignee ? (
                          <>
                            <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
                              {getInitials(selectedTask.assignee.name)}
                            </div>
                            <span className="text-sm">
                              {selectedTask.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    {editMode ? (
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <span
                        className={cn(
                          'text-sm',
                          selectedTask.dueDate
                            ? isOverdue(selectedTask.dueDate)
                              ? 'text-red-500 font-medium'
                              : ''
                            : 'text-muted-foreground'
                        )}
                      >
                        {selectedTask.dueDate
                          ? formatDate(selectedTask.dueDate)
                          : 'Not set'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Project</Label>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: selectedTask.project.color }}
                      />
                      <span className="text-sm">{selectedTask.project.name}</span>
                    </div>
                  </div>

                  {selectedTask.estimateHours != null && selectedTask.estimateHours > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Estimate</Label>
                      <span className="text-sm">
                        {selectedTask.estimateHours}h
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Subtasks */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">
                      Subtasks ({selectedTask._count.subtasks})
                    </Label>
                  </div>
                  {selectedTask._count.subtasks > 0 ? (
                    <p className="text-sm text-muted-foreground pl-6">
                      This task has {selectedTask._count.subtasks} subtask
                      {selectedTask._count.subtasks !== 1 ? 's' : ''}.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 pl-6 italic">
                      No subtasks
                    </p>
                  )}
                </div>

                <Separator />

                {/* Comments */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">
                      Comments ({selectedTask._count.comments})
                    </Label>
                  </div>

                  <div className="flex gap-2 pl-6">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium">
                      {getInitials(user?.name)}
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Input
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && commentText.trim()) {
                            // Comment submission would go here via a POST endpoint
                            // For now, we'll show a toast since there's no dedicated comments API
                            toast.info('Comment API not yet implemented');
                            setCommentText('');
                          }
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {selectedTask._count.comments > 0 ? (
                    <p className="text-xs text-muted-foreground/60 pl-6">
                      {selectedTask._count.comments} comment
                      {selectedTask._count.comments !== 1 ? 's' : ''} — load
                      via dedicated endpoint
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 pl-6 italic">
                      No comments yet
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-2">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        // Reset edit fields to original
                        if (selectedTask) {
                          setEditTitle(selectedTask.title);
                          setEditDesc(selectedTask.description || '');
                          setEditStatus(selectedTask.status);
                          setEditPriority(selectedTask.priority);
                          setEditAssigneeId(selectedTask.assigneeId || '');
                          setEditDueDate(selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '');
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdits}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit Task
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.id}
          className="w-72 shrink-0 rounded-xl bg-muted/40 p-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto size-5 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-2.5">
                <Skeleton className="mb-1.5 h-3 w-12" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-2/3" />
                <div className="mt-2 flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <div className="flex gap-16">
          {['Title', 'Status', 'Priority', 'Assignee', 'Project', 'Due'].map(
            (h) => (
              <Skeleton key={h} className="h-4 w-16" />
            )
          )}
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-16 border-b px-4 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}