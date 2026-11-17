'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FolderKanban,
  CheckSquare,
  CheckCircle,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  CalendarPlus,
  ListTodo,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const monthLabels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const PIE_COLORS = [
  'oklch(0.646 0.222 41.116)',  // amber
  'oklch(0.6 0.118 184.704)',   // teal
  'oklch(0.398 0.07 227.392)',  // blue
  'oklch(0.708 0 0)',           // gray
  'oklch(0.577 0.245 27.325)',  // red
  'oklch(0.769 0.188 70.08)',   // yellow
];

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const;

/* -------------------------------------------------------------------------- */
/*  Helper components                                                         */
/* -------------------------------------------------------------------------- */

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="mt-1 h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'just now';
  }
}

function formatMeetingTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'TBD';
  }
}

/* -------------------------------------------------------------------------- */
/*  Dashboard Page                                                            */
/* -------------------------------------------------------------------------- */

export function DashboardPage() {
  const setPage = useAppStore((s) => s.setPage);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  });

  /* ---- derived data ---- */

  const revenueChartData = useMemo(() => {
    if (!data?.revenueData) return [];
    return monthLabels.map((month, i) => ({
      month,
      revenue: data.revenueData[i] ?? 0,
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.taskStatusDistribution?.length) return [];
    return data.taskStatusDistribution.map((d: { status: string; count: number }) => ({
      name: d.status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase()),
      value: d.count,
    }));
  }, [data]);

  const activeTasks = useMemo(() => {
    if (!data) return 0;
    return (data.totalTasks ?? 0) - (data.completedTasks ?? 0);
  }, [data]);

  /* ---- loading state ---- */

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  /* ---- stats config ---- */

  const stats = [
    {
      label: 'Total Projects',
      value: data?.totalProjects ?? 0,
      change: 12,
      icon: FolderKanban,
      iconBg: 'bg-chart-1/15 text-chart-1',
    },
    {
      label: 'Active Tasks',
      value: activeTasks,
      change: 8,
      icon: CheckSquare,
      iconBg: 'bg-chart-2/15 text-chart-2',
    },
    {
      label: 'Completed Tasks',
      value: data?.completedTasks ?? 0,
      change: 24,
      icon: CheckCircle,
      iconBg: 'bg-chart-3/15 text-chart-3',
    },
    {
      label: 'Team Members',
      value: data?.teamSize ?? 0,
      change: 0,
      icon: Users,
      iconBg: 'bg-chart-4/15 text-chart-4',
    },
  ];

  const recentActivity = (data?.recentActivity ?? []).slice(0, 8);
  const upcomingMeetings = data?.upcomingMeetings ?? [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 p-6"
    >
      {/* Page header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your workspace activity.
        </p>
      </motion.div>

      {/* ---- Stats row ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.change >= 0;
          return (
            <motion.div key={stat.label} variants={item}>
              <Card className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${stat.iconBg}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    {stat.change > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="size-3" />
                        +{stat.change}%
                      </span>
                    )}
                    {stat.change === 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <TrendingDown className="size-3" />
                        &mdash;
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ---- Charts row ---- */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue chart */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Monthly revenue for the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueChartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="oklch(0.646 0.222 41.116)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="oklch(0.646 0.222 41.116)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="oklch(1 0 0 / 6%)"
                      className="dark:stroke-[oklch(1_0_0/8%)]"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                      className="dark:[&_*]:fill-[oklch(0.708_0_0)]"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                      className="dark:[&_*]:fill-[oklch(0.708_0_0)]"
                      tickFormatter={(v: number) =>
                        `$${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.922 0 0)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        'Revenue',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="oklch(0.646 0.222 41.116)"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: 'oklch(1 0 0)',
                        fill: 'oklch(0.646 0.222 41.116)',
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task distribution */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Task Distribution</CardTitle>
              <CardDescription>Tasks grouped by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-[200px] w-[200px] shrink-0">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(1 0 0)',
                            border: '1px solid oklch(0.922 0 0)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '13px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No task data yet
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2.5 min-w-0">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      <span className="truncate text-sm text-muted-foreground">
                        {entry.name}
                      </span>
                      <span className="ml-auto text-sm font-medium tabular-nums">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ---- Bottom row ---- */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent activity */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions from your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivity.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No recent activity
                  </p>
                )}
                {recentActivity.map(
                  (activity: Record<string, any>, i: number) => (
                    <div
                      key={activity.id ?? i}
                      className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="mt-0.5 size-8">
                        <AvatarImage
                          src={activity.user?.avatar}
                          alt={activity.user?.name}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(activity.user?.name ?? 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">
                            {activity.user?.name ?? 'Someone'}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            {activity.action ?? 'performed an action'}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column: Meetings + Quick Actions */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Upcoming meetings */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Next scheduled sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingMeetings.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No upcoming meetings
                    </p>
                  )}
                  {upcomingMeetings.map(
                    (meeting: Record<string, any>, i: number) => (
                      <div
                        key={meeting.id ?? i}
                        className="group flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-1/10">
                          <Clock className="size-4 text-chart-1" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug truncate">
                            {meeting.title ?? 'Untitled Meeting'}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatMeetingTime(meeting.startTime)}
                          </p>
                        </div>
                        <div className="flex -space-x-1.5">
                          {(meeting.attendees ?? [])
                            .slice(0, 3)
                            .map(
                              (attendee: Record<string, any>, j: number) => (
                                <Avatar
                                  key={attendee.id ?? j}
                                  className="size-6 border-2 border-card"
                                >
                                  <AvatarImage
                                    src={attendee.user?.avatar}
                                    alt={attendee.user?.name}
                                  />
                                  <AvatarFallback className="text-[9px]">
                                    {getInitials(
                                      attendee.user?.name ?? 'U'
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                              )
                            )}
                          {((meeting.attendees ?? []).length > 3) && (
                            <div className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">
                              +
                              {meeting.attendees.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump into your most-used workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    className="h-10 justify-start gap-2.5 text-sm font-normal"
                    onClick={() => setPage('projects')}
                  >
                    <Plus className="size-4 text-chart-1" />
                    New Project
                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground/60" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 justify-start gap-2.5 text-sm font-normal"
                    onClick={() => setPage('tasks')}
                  >
                    <ListTodo className="size-4 text-chart-2" />
                    Create Task
                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground/60" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 justify-start gap-2.5 text-sm font-normal"
                    onClick={() => setPage('calendar')}
                  >
                    <CalendarPlus className="size-4 text-chart-3" />
                    Schedule Meeting
                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground/60" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}