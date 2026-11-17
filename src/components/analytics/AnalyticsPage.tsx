'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  CheckCircle2,
  TrendingUp,
  FolderKanban,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// --- Types ---
interface TasksByPriority {
  priority: string;
  count: number;
}

interface TeamPerformanceMember {
  name: string;
  completedTasks: number;
  activeTasks?: number;
  completionRate?: number;
  avatar?: string | null;
}

interface ProjectProgressItem {
  name: string;
  progress: number;
  color?: string;
  totalTasks?: number;
  completedTasks?: number;
}

interface AnalyticsData {
  tasksByPriority: TasksByPriority[];
  tasksByStatus: { status: string; count: number }[];
  projectProgress: ProjectProgressItem[];
  teamPerformance: TeamPerformanceMember[];
  productivityTrend: number[];
  revenueByMonth: number[];
}

// --- Demo / fallback data ---
const DEMO_DATA: AnalyticsData = {
  tasksByPriority: [
    { priority: 'LOW', count: 12 },
    { priority: 'MEDIUM', count: 28 },
    { priority: 'HIGH', count: 18 },
    { priority: 'URGENT', count: 7 },
  ],
  tasksByStatus: [
    { status: 'TODO', count: 15 },
    { status: 'IN_PROGRESS', count: 22 },
    { status: 'DONE', count: 45 },
  ],
  projectProgress: [
    { name: 'Website Redesign', progress: 78, color: '#6366f1' },
    { name: 'Mobile App', progress: 52, color: '#8b5cf6' },
    { name: 'API Integration', progress: 91, color: '#06b6d4' },
    { name: 'Dashboard v2', progress: 34, color: '#f59e0b' },
  ],
  teamPerformance: [
    { name: 'Alex Morgan', completedTasks: 28, activeTasks: 5, completionRate: 93 },
    { name: 'Sarah Chen', completedTasks: 24, activeTasks: 3, completionRate: 89 },
    { name: 'James Wilson', completedTasks: 31, activeTasks: 7, completionRate: 95 },
    { name: 'Emily Davis', completedTasks: 19, activeTasks: 4, completionRate: 86 },
    { name: 'Michael Brown', completedTasks: 22, activeTasks: 6, completionRate: 88 },
    { name: 'Lisa Taylor', completedTasks: 32, activeTasks: 2, completionRate: 97 },
  ],
  productivityTrend: [12, 19, 15, 22, 18, 25, 21, 28],
  revenueByMonth: [12400, 15800, 13200, 18900, 16500, 21000],
};

const STATS = [
  {
    title: 'Total Revenue',
    value: '$97,800',
    change: '+12.5%',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Tasks Completed',
    value: '156',
    change: '+8.3%',
    icon: CheckCircle2,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Team Productivity',
    value: '94.2%',
    change: '+2.1%',
    icon: TrendingUp,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    title: 'Active Projects',
    value: '4',
    change: null,
    icon: FolderKanban,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

const TIME_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days'] as const;

const trendChartConfig = {
  tasks: { label: 'Tasks Completed', color: '#6366f1' },
} as const;

const priorityChartConfig = {
  count: { label: 'Tasks', color: '#6366f1' },
} as const;

const progressChartConfig = {
  progress: { label: 'Progress %', color: '#6366f1' },
} as const;

const teamChartConfig = {
  completedTasks: { label: 'Completed', color: '#6366f1' },
} as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'];

// --- Sub-components ---

function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.07 }}
        >
          <Card className="gap-4">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardDescription className="text-sm font-medium">
                {stat.title}
              </CardDescription>
              <div className={cn('rounded-lg p-2', stat.bg)}>
                <stat.icon className={cn('size-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                {stat.change && (
                  <Badge
                    variant="secondary"
                    className="mb-1 gap-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    <ArrowUpRight className="size-3" />
                    {stat.change}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// --- Main Component ---

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>('Last 30 days');

  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  const analytics = data || DEMO_DATA;

  // Transform data for charts
  const trendData = analytics.productivityTrend.map((value, index) => ({
    week: `Week ${index + 1}`,
    tasks: value,
  }));

  const priorityData = analytics.tasksByPriority.map((item) => ({
    ...item,
    fill: PRIORITY_COLORS[item.priority] || '#6366f1',
  }));

  const projectData = analytics.projectProgress.map((item, index) => ({
    ...item,
    fill: item.color || PROJECT_COLORS[index % PROJECT_COLORS.length],
  }));

  const teamChartData = analytics.teamPerformance.map((member) => ({
    ...member,
    completedTasks: member.completedTasks || 0,
  }));

  // Enrich team performance with defaults if missing
  const teamTableData = analytics.teamPerformance.map((member) => ({
    ...member,
    activeTasks: member.activeTasks ?? Math.floor(Math.random() * 6) + 1,
    completionRate: member.completionRate ?? Math.floor(Math.random() * 20) + 80,
  }));

  if (isLoading) return <AnalyticsSkeleton />;

  return (
    <motion.div
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Track your team&apos;s performance and project metrics
          </p>
        </div>

        {/* Time range toggle */}
        <div className="inline-flex h-9 items-center rounded-lg border bg-muted p-1 text-sm">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-all',
                timeRange === range
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <StatsCards />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Task Completion Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trend</CardTitle>
              <CardDescription>Weekly task completions over the last 8 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    stroke="var(--color-tasks)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--color-tasks)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks by Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
              <CardDescription>Distribution of tasks across priority levels</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={priorityChartConfig} className="h-[280px] w-full">
                <BarChart data={priorityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="priority"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Overall completion percentage per project</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={progressChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={projectData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Tasks completed per team member</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={teamChartConfig} className="h-[280px] w-full">
                <BarChart data={teamChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completedTasks" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
            <CardDescription>Detailed breakdown of team member productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Tasks Completed</TableHead>
                  <TableHead className="text-right">Active Tasks</TableHead>
                  <TableHead className="text-right">Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamTableData.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-right">{member.completedTasks}</TableCell>
                    <TableCell className="text-right">{member.activeTasks}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'ml-auto',
                          member.completionRate! >= 90
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : member.completionRate! >= 80
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        )}
                      >
                        {member.completionRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error fallback notice */}
      {isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
          Showing demo data. Could not connect to the server.
        </div>
      )}
    </motion.div>
  );
}