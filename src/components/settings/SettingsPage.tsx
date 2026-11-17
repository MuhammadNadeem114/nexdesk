'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User,
  Shield,
  Palette,
  Bell,
  Building2,
  Camera,
  Save,
  Moon,
  Sun,
  Laptop,
  Globe,
  CreditCard,
  Smartphone,
  Tablet,
  LogOut,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Types ---
interface UserSettings {
  theme?: string;
  language?: string;
  sidebarCollapsed?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  taskAssignmentNotifications?: boolean;
  dueDateReminders?: boolean;
  mentionNotifications?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  avatar?: string | null;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

// --- Demo data ---
const DEMO_USER: UserProfile = {
  name: 'Alex Morgan',
  email: 'alex.morgan@nexdesk.ai',
  bio: 'Product-focused engineer passionate about building tools that help teams work better together.',
  phone: '+1 (555) 123-4567',
  jobTitle: 'Senior Software Engineer',
  department: 'Engineering',
  avatar: null,
};

const DEMO_ORG_MEMBERS: OrgMember[] = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex.morgan@nexdesk.ai', role: 'Admin', avatar: null },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah.chen@nexdesk.ai', role: 'Admin', avatar: null },
  { id: 'u3', name: 'James Wilson', email: 'james.wilson@nexdesk.ai', role: 'Member', avatar: null },
  { id: 'u4', name: 'Emily Davis', email: 'emily.davis@nexdesk.ai', role: 'Member', avatar: null },
  { id: 'u5', name: 'Michael Brown', email: 'michael.brown@nexdesk.ai', role: 'Member', avatar: null },
  { id: 'u6', name: 'Lisa Taylor', email: 'lisa.taylor@nexdesk.ai', role: 'Viewer', avatar: null },
];

const DEMO_SESSIONS = [
  {
    id: 's1',
    device: 'MacBook Pro',
    icon: Laptop,
    location: 'San Francisco, CA',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 's2',
    device: 'iPhone 15',
    icon: Smartphone,
    location: 'San Francisco, CA',
    lastActive: '2 hours ago',
    current: false,
  },
  {
    id: 's3',
    device: 'iPad Air',
    icon: Tablet,
    location: 'San Francisco, CA',
    lastActive: '1 day ago',
    current: false,
  },
];

const SETTINGS_TABS = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'organization', label: 'Organization', icon: Building2 },
] as const;

// --- Sub-components ---

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Profile Tab ---

function ProfileTab() {
  const [form, setForm] = useState<UserProfile>(DEMO_USER);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <Avatar className="size-20">
          <AvatarImage src={form.avatar ?? undefined} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{form.name}</h3>
          <p className="text-muted-foreground text-sm">{form.email}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => toast.info('Avatar upload is not available in demo mode')}>
            <Camera className="size-3.5" />
            Change
          </Button>
        </div>
      </div>

      <Separator />

      {/* Form fields */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            value={form.jobTitle ?? ''}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={form.department ?? ''}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          value={form.bio ?? ''}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </motion.div>
  );
}

// --- Security Tab ---

function SecurityTab() {
  const [passwords, setPasswords] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });
  const [twoFactor, setTwoFactor] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    // Simulated
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Password changed successfully');
    setPasswords({ current: '', newPassword: '', confirm: '' });
    setChangingPassword(false);
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleChangePassword();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwords.current || !passwords.newPassword}
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {twoFactor ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-muted-foreground text-xs">
                {twoFactor
                  ? 'Your account is protected with 2FA'
                  : 'Enable 2FA for enhanced security'}
              </p>
            </div>
            <Switch
              checked={twoFactor}
              onCheckedChange={(checked) => {
                setTwoFactor(checked);
                toast.info(checked ? '2FA enabled (demo)' : '2FA disabled (demo)');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_SESSIONS.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <session.icon className="text-muted-foreground size-4" />
                      <div>
                        <p className="text-sm font-medium">{session.device}</p>
                        {session.current && (
                          <Badge variant="secondary" className="mt-0.5 text-[10px]">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {session.location}
                  </TableCell>
                  <TableCell className="text-sm">{session.lastActive}</TableCell>
                  <TableCell className="text-right">
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => toast.info('Session revoked (demo)')}
                      >
                        <LogOut className="size-3.5" />
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Appearance Tab ---

function AppearanceTab() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [sidebarDefault, setSidebarDefault] = useState<'expanded' | 'collapsed'>('expanded');
  const [language, setLanguage] = useState('en');

  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system');
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Choose how NexDesk looks to you</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {[
              { value: 'light', label: 'Light', icon: Sun, description: 'Clean light theme' },
              { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
              { value: 'system', label: 'System', icon: Laptop, description: 'Follow your OS setting' },
            ].map((option) => (
              <label
                key={option.value}
                htmlFor={`theme-${option.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors',
                  theme === option.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={option.value} id={`theme-${option.value}`} />
                <option.icon className={cn('size-5', theme === option.value ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-muted-foreground text-xs">{option.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Sidebar Default */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sidebar</CardTitle>
          <CardDescription>Set the default sidebar state</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={sidebarDefault}
            onValueChange={(v) => setSidebarDefault(v as 'expanded' | 'collapsed')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {[
              { value: 'expanded', label: 'Expanded', description: 'Show sidebar labels and icons' },
              { value: 'collapsed', label: 'Collapsed', description: 'Show icons only' },
            ].map((option) => (
              <label
                key={option.value}
                htmlFor={`sidebar-${option.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors',
                  sidebarDefault === option.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={option.value} id={`sidebar-${option.value}`} />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-muted-foreground text-xs">{option.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language</CardTitle>
          <CardDescription>Select your preferred display language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <Globe className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Notifications Tab ---

function NotificationsTab() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskAssignmentNotifications: true,
    dueDateReminders: true,
    mentionNotifications: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const NOTIFICATION_ITEMS: {
    key: keyof typeof prefs;
    label: string;
    description: string;
  }[] = [
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'pushNotifications',
      label: 'Push Notifications',
      description: 'Receive push notifications in your browser',
    },
    {
      key: 'taskAssignmentNotifications',
      label: 'Task Assignments',
      description: 'Get notified when a task is assigned to you',
    },
    {
      key: 'dueDateReminders',
      label: 'Due Date Reminders',
      description: 'Remind me before task due dates',
    },
    {
      key: 'mentionNotifications',
      label: 'Mention Notifications',
      description: 'Get notified when someone mentions you',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {NOTIFICATION_ITEMS.map((item, index) => (
            <React.Fragment key={item.key}>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </div>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={() => togglePref(item.key)}
                />
              </div>
              {index < NOTIFICATION_ITEMS.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </motion.div>
  );
}

// --- Organization Tab ---

function OrganizationTab() {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Org Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>Information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">Organization Name</p>
              <p className="text-sm font-medium">NexDesk Inc.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">Billing Plan</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Pro Plan</p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">$29/month</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">Description</p>
            <p className="text-sm">
              NexDesk Inc. is a technology company focused on building collaborative
              productivity tools for modern teams. We believe in streamlining workflows
              and empowering teams to achieve their best work.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => toast.info('Subscription management is not available in demo mode')}
            >
              <CreditCard className="size-4" />
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>
            {DEMO_ORG_MEMBERS.length} members in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_ORG_MEMBERS.map((member) => {
                const initials = member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={member.avatar ?? undefined} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === 'Admin'
                            ? 'default'
                            : member.role === 'Member'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== 'Admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => toast.info('Member removal is not available in demo mode')}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Remove member</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Main Component ---

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch settings from API
  const { data: settingsData, isLoading } = useQuery<{ settings: UserSettings }>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  if (isLoading) return <SettingsSkeleton />;

  return (
    <motion.div
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and application preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          {SETTINGS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 whitespace-nowrap"
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <TabsContent key="profile" value="profile" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfileTab />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === 'security' && (
              <TabsContent key="security" value="security" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SecurityTab />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === 'appearance' && (
              <TabsContent key="appearance" value="appearance" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AppearanceTab />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === 'notifications' && (
              <TabsContent key="notifications" value="notifications" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <NotificationsTab />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === 'organization' && (
              <TabsContent key="organization" value="organization" forceMount>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <OrganizationTab />
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  );
}