'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  CheckCircle2,
  ListTodo,
  Building2,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    bio: string | null;
    jobTitle: string | null;
    department: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
  };
  teams: Array<{
    id: string;
    name: string;
    color: string;
    description: string | null;
  }>;
  taskStats: {
    assigned: number;
    completed: number;
  };
}

const ROLE_COLORS: Record<string, string> = {
  ORG_OWNER:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  MANAGER:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  EMPLOYEE:
    'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

const ROLE_LABELS: Record<string, string> = {
  ORG_OWNER: 'Owner',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MemberCard({
  member,
  onViewProfile,
}: {
  member: TeamMember;
  onViewProfile: () => void;
}) {
  const activeTasks = member.taskStats.assigned - member.taskStats.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
    >
      <Card className="group overflow-hidden transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-6">
          {/* Avatar & Role */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 ring-4 ring-background shadow-sm">
              <AvatarImage
                src={member.user.avatar || undefined}
                alt={member.user.name || 'User'}
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(member.user.name)}
              </AvatarFallback>
            </Avatar>

            <h3 className="mt-4 text-base font-semibold leading-tight">
              {member.user.name || 'Unknown User'}
            </h3>

            {member.user.jobTitle && (
              <p className="mt-1 text-sm text-muted-foreground">
                {member.user.jobTitle}
              </p>
            )}

            {member.user.department && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="size-3" />
                {member.user.department}
              </p>
            )}

            {/* Role Badge */}
            <Badge
              variant="outline"
              className={`mt-3 ${ROLE_COLORS[member.role] || ROLE_COLORS.EMPLOYEE}`}
            >
              {ROLE_LABELS[member.role] || member.role}
            </Badge>
          </div>

          <Separator className="my-4" />

          {/* Team Pills */}
          {member.teams.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {member.teams.map((team) => (
                <span
                  key={team.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Completed
              </span>
              <span className="font-medium">
                {member.taskStats.completed} tasks
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ListTodo className="size-3.5 text-blue-500" />
                Active
              </span>
              <span className="font-medium">{activeTasks} tasks</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Contact Info */}
          <div className="mb-4 space-y-1.5">
            <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {member.user.email}
            </p>
          </div>

          {/* View Profile */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewProfile}
          >
            View Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProfileDialog({
  member,
  open,
  onOpenChange,
}: {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!member) return null;

  const activeTasks = member.taskStats.assigned - member.taskStats.completed;
  const completionRate =
    member.taskStats.assigned > 0
      ? Math.round(
          (member.taskStats.completed / member.taskStats.assigned) * 100
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Member Profile</DialogTitle>
          <DialogDescription>
            Detailed information about this team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-border">
              <AvatarImage
                src={member.user.avatar || undefined}
                alt={member.user.name || 'User'}
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(member.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">
                {member.user.name || 'Unknown User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {member.user.jobTitle || 'No title'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={ROLE_COLORS[member.role] || ROLE_COLORS.EMPLOYEE}
                >
                  {ROLE_LABELS[member.role] || member.role}
                </Badge>
                {member.user.department && (
                  <span className="text-xs text-muted-foreground">
                    {member.user.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          {member.user.bio && (
            <div>
              <h4 className="mb-1.5 text-sm font-medium">Bio</h4>
              <p className="text-sm text-muted-foreground">{member.user.bio}</p>
            </div>
          )}

          {/* Contact */}
          <div>
            <h4 className="mb-1.5 text-sm font-medium">Contact</h4>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4 text-muted-foreground/70" />
                {member.user.email}
              </p>
            </div>
          </div>

          {/* Teams */}
          <div>
            <h4 className="mb-1.5 text-sm font-medium">Teams</h4>
            <div className="flex flex-wrap gap-1.5">
              {member.teams.length > 0 ? (
                member.teams.map((team) => (
                  <span
                    key={team.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No teams yet
                </span>
              )}
            </div>
          </div>

          {/* Task Stats */}
          <div>
            <h4 className="mb-1.5 text-sm font-medium">Task Statistics</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">
                  {member.taskStats.completed}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{activeTasks}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div>
            <h4 className="mb-1.5 text-sm font-medium">Details</h4>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p>Joined on {formatDate(member.joinedAt)}</p>
              {member.user.lastLoginAt && (
                <p>Last login {formatDate(member.user.lastLoginAt)}</p>
              )}
              <p className="flex items-center gap-1.5">
                <span
                  className={`inline-block size-2 rounded-full ${
                    member.user.isActive
                      ? 'bg-emerald-500'
                      : 'bg-gray-400'
                  }`}
                />
                {member.user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="mt-4 h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-20" />
          <Skeleton className="mt-3 h-5 w-16 rounded-full" />
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Separator className="my-4" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export function TeamPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [profileMember, setProfileMember] = useState<TeamMember | null>(null);

  const { data, isLoading, error } = useQuery<{ members: TeamMember[] }>({
    queryKey: ['team'],
    queryFn: () => fetch('/api/team').then((r) => r.json()),
  });

  const members = data?.members || [];

  // Extract unique team names for tabs
  const teamNames = useMemo(() => {
    const names = new Set<string>();
    members.forEach((m) => m.teams.forEach((t) => names.add(t.name)));
    return Array.from(names).sort();
  }, [members]);

  // Filter members by tab
  const filteredMembers = useMemo(() => {
    if (activeTab === 'all') return members;
    return members.filter((m) =>
      m.teams.some((t) => t.name === activeTab)
    );
  }, [members, activeTab]);

  const handleInvite = () => {
    toast({
      title: 'Invite sent!',
      description: 'An invitation email has been sent to the new member.',
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''} in your
            organization
          </p>
        </div>
        <Button onClick={handleInvite}>
          <UserPlus className="size-4" />
          Invite Member
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <Users className="size-3.5" />
            All Members
          </TabsTrigger>
          {teamNames.map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* We only need one content - we'll render the grid below the tabs */}
        <TabsContent value={activeTab}>
          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Failed to load team members. Please try again.
              </p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MemberCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredMembers.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Users className="mb-3 size-10 text-muted-foreground/50" />
              <h3 className="text-sm font-medium">No members found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeTab === 'all'
                  ? 'No team members yet. Invite someone to get started.'
                  : `No members in the "${activeTab}" team.`}
              </p>
            </div>
          )}

          {/* Member Grid */}
          {!isLoading && filteredMembers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.userId}
                    member={member}
                    onViewProfile={() => setProfileMember(member)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Profile Dialog */}
      <ProfileDialog
        member={profileMember}
        open={!!profileMember}
        onOpenChange={(open) => {
          if (!open) setProfileMember(null);
        }}
      />
    </div>
  );
}