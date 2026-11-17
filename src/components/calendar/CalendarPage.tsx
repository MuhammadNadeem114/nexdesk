'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  isBefore,
  parseISO,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  Calendar as CalendarIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// --- Types ---
interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  location?: string;
  link?: string;
  color: string;
  attendees?: { name: string; avatar?: string | null }[];
}

type CalendarView = 'month' | 'week';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = [
  { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-500/15', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
  { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
];

// --- Demo events generator ---
function generateDemoEvents(referenceDate: Date): CalendarEvent[] {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  const events: CalendarEvent[] = [
    {
      id: 'e1',
      title: 'Sprint Planning',
      date: new Date(year, month, 2).toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:00',
      location: 'Conference Room A',
      color: 'blue',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'James Wilson', avatar: null },
      ],
    },
    {
      id: 'e2',
      title: 'Design Review',
      date: new Date(year, month, 2).toISOString().slice(0, 10),
      startTime: '14:00',
      endTime: '15:30',
      link: 'https://meet.example.com/design-review',
      color: 'violet',
      attendees: [
        { name: 'Emily Davis', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e3',
      title: 'Client Call - Acme Corp',
      date: new Date(year, month, 5).toISOString().slice(0, 10),
      startTime: '11:00',
      endTime: '12:00',
      link: 'https://meet.example.com/acme-call',
      color: 'emerald',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Michael Brown', avatar: null },
      ],
    },
    {
      id: 'e4',
      title: 'Team Standup',
      date: new Date(year, month, 7).toISOString().slice(0, 10),
      startTime: '09:30',
      endTime: '09:45',
      location: 'Virtual',
      color: 'blue',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'James Wilson', avatar: null },
        { name: 'Emily Davis', avatar: null },
        { name: 'Michael Brown', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e5',
      title: 'Backend Sync',
      date: new Date(year, month, 7).toISOString().slice(0, 10),
      startTime: '14:00',
      endTime: '15:00',
      location: 'Conference Room B',
      color: 'amber',
      attendees: [
        { name: 'James Wilson', avatar: null },
        { name: 'Michael Brown', avatar: null },
      ],
    },
    {
      id: 'e6',
      title: 'Product Roadmap Review',
      date: new Date(year, month, 7).toISOString().slice(0, 10),
      startTime: '16:00',
      endTime: '17:00',
      location: 'Board Room',
      color: 'rose',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'Emily Davis', avatar: null },
      ],
    },
    {
      id: 'e7',
      title: '1:1 with Manager',
      date: new Date(year, month, 10).toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '10:30',
      link: 'https://meet.example.com/one-on-one',
      color: 'cyan',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
      ],
    },
    {
      id: 'e8',
      title: 'Sprint Demo',
      date: new Date(year, month, 12).toISOString().slice(0, 10),
      startTime: '15:00',
      endTime: '16:00',
      location: 'Main Hall',
      color: 'emerald',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'James Wilson', avatar: null },
        { name: 'Emily Davis', avatar: null },
        { name: 'Michael Brown', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e9',
      title: 'Retrospective',
      date: new Date(year, month, 14).toISOString().slice(0, 10),
      startTime: '14:00',
      endTime: '15:00',
      link: 'https://meet.example.com/retro',
      color: 'violet',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'James Wilson', avatar: null },
        { name: 'Emily Davis', avatar: null },
      ],
    },
    {
      id: 'e10',
      title: 'Architecture Discussion',
      date: new Date(year, month, 16).toISOString().slice(0, 10),
      startTime: '11:00',
      endTime: '12:30',
      location: 'Conference Room A',
      color: 'pink',
      attendees: [
        { name: 'James Wilson', avatar: null },
        { name: 'Michael Brown', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e11',
      title: 'Weekly Team Sync',
      date: new Date(year, month, 18).toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '11:00',
      location: 'Virtual',
      color: 'blue',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'James Wilson', avatar: null },
        { name: 'Emily Davis', avatar: null },
      ],
    },
    {
      id: 'e12',
      title: 'Stakeholder Update',
      date: new Date(year, month, 20).toISOString().slice(0, 10),
      startTime: '13:00',
      endTime: '14:00',
      link: 'https://meet.example.com/stakeholder',
      color: 'orange',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e13',
      title: 'Code Review Session',
      date: new Date(year, month, 22).toISOString().slice(0, 10),
      startTime: '15:00',
      endTime: '16:00',
      location: 'Conference Room B',
      color: 'amber',
      attendees: [
        { name: 'James Wilson', avatar: null },
        { name: 'Michael Brown', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e14',
      title: 'Monthly All-Hands',
      date: new Date(year, month, 25).toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '11:30',
      link: 'https://meet.example.com/all-hands',
      color: 'rose',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'James Wilson', avatar: null },
        { name: 'Emily Davis', avatar: null },
        { name: 'Michael Brown', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e15',
      title: 'Design Workshop',
      date: new Date(year, month, 25).toISOString().slice(0, 10),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Creative Studio',
      color: 'violet',
      attendees: [
        { name: 'Emily Davis', avatar: null },
        { name: 'Lisa Taylor', avatar: null },
      ],
    },
    {
      id: 'e16',
      title: 'Release Planning',
      date: new Date(year, month, 28).toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:30',
      location: 'Conference Room A',
      color: 'emerald',
      attendees: [
        { name: 'Alex Morgan', avatar: null },
        { name: 'Sarah Chen', avatar: null },
        { name: 'James Wilson', avatar: null },
      ],
    },
    {
      id: 'e17',
      title: 'Security Review',
      date: new Date(year, month, 28).toISOString().slice(0, 10),
      startTime: '14:00',
      endTime: '15:00',
      link: 'https://meet.example.com/security',
      color: 'rose',
      attendees: [
        { name: 'Michael Brown', avatar: null },
        { name: 'James Wilson', avatar: null },
      ],
    },
  ];

  return events;
}

// --- Sub-components ---

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <Skeleton className="mb-4 h-8 w-full" />
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24 sm:h-28" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl lg:block" />
      </div>
    </div>
  );
}

function EventPill({
  event,
  colorStyle,
  onClick,
}: {
  event: CalendarEvent;
  colorStyle: (typeof EVENT_COLORS)[number];
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-80',
        colorStyle.bg,
        colorStyle.text
      )}
    >
      <div className={cn('size-1.5 shrink-0 rounded-full', colorStyle.dot)} />
      <span className="truncate font-medium">{event.title}</span>
    </button>
  );
}

function MiniCalendar({
  currentMonth,
  selectedDate,
  onDateSelect,
  events,
}: {
  currentMonth: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dayArray: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      dayArray.push(day);
      day = addDays(day, 1);
    }
    return dayArray;
  }, [currentMonth]);

  const eventDates = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const key = e.date;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [events]);

  return (
    <div>
      <p className="mb-3 text-sm font-medium">
        {format(currentMonth, 'MMMM yyyy')}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider"
          >
            {d.charAt(0)}
          </div>
        ))}
        {days.map((day) => {
          const count = eventDates.get(format(day, 'yyyy-MM-dd')) || 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'relative mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-colors',
                !isSameMonth(day, currentMonth) && 'text-muted-foreground/40',
                isSameMonth(day, currentMonth) && !isSelected && 'hover:bg-muted',
                isToday(day) && !isSelected && 'font-bold text-primary',
                isSelected && 'bg-primary text-primary-foreground'
              )}
            >
              {format(day, 'd')}
              {count > 0 && (
                <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  const upcoming = useMemo(() => {
    const today = startOfDay(new Date());
    return events
      .filter((e) => !isBefore(parseISO(e.date), today))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 6);
  }, [events]);

  if (upcoming.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">No upcoming events</p>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((event) => {
        const colorStyle = EVENT_COLORS.find((c) => c.dot.includes(event.color)) || EVENT_COLORS[0];
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
          >
            <div className={cn('mt-1.5 size-2 shrink-0 rounded-full', colorStyle.dot)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{event.title}</p>
              <p className="text-muted-foreground text-xs">
                {format(parseISO(event.date), 'MMM d')} &middot; {event.startTime} - {event.endTime}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventDialog({
  event,
  open,
  onOpenChange,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event) return null;

  const colorStyle = EVENT_COLORS.find((c) => c.dot.includes(event.color)) || EVENT_COLORS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('size-3 rounded-full', colorStyle.dot)} />
            <DialogTitle>{event.title}</DialogTitle>
          </div>
          <DialogDescription>
            {format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="text-muted-foreground size-4" />
            <span>
              {event.startTime} - {event.endTime}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="text-muted-foreground size-4" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Link */}
          {event.link && (
            <div className="flex items-center gap-3 text-sm">
              <Video className="text-muted-foreground size-4" />
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Join Meeting
              </a>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="text-muted-foreground size-4" />
                  Attendees ({event.attendees.length})
                </div>
                <div className="space-y-2">
                  {event.attendees.map((attendee) => (
                    <div key={attendee.name} className="flex items-center gap-3">
                      <Avatar className="size-7">
                        <AvatarImage src={attendee.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {attendee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Use July 2026 as demo reference
    return new Date(2026, 6, 1);
  });
  const [view, setView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const events = useMemo(() => generateDemoEvents(currentMonth), [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [events]);

  // Build calendar days for the month grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return events
      .filter((e) => !isBefore(parseISO(e.date), today))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [events]);

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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            Manage your schedule and upcoming events
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="inline-flex h-9 items-center rounded-lg border bg-muted p-1 text-sm">
            <button
              onClick={() => setView('month')}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-all',
                view === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-all',
                view === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Week
            </button>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-9" onClick={handlePrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" className="size-9" onClick={handleNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar body + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {view === 'month' ? (
            <Card>
              <CardContent className="p-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b">
                  {DAY_NAMES.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const inMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);
                    const maxVisible = 3;
                    const visibleEvents = dayEvents.slice(0, maxVisible);
                    const extraCount = dayEvents.length - maxVisible;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'group relative border-b border-r p-1 transition-colors last:border-r-0',
                          !inMonth && 'bg-muted/30',
                          'min-h-[80px] sm:min-h-[100px] lg:min-h-[110px]'
                        )}
                      >
                        {/* Day number */}
                        <div className="mb-1 flex items-center justify-between px-1">
                          <span
                            className={cn(
                              'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                              today && 'bg-primary text-primary-foreground',
                              !today && !inMonth && 'text-muted-foreground/50',
                              !today && inMonth && 'text-foreground'
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {dayEvents.length > 0 && inMonth && (
                            <span className="text-muted-foreground text-[10px]">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events */}
                        <div className="space-y-0.5">
                          {visibleEvents.map((event) => {
                            const colorStyle =
                              EVENT_COLORS.find((c) => c.dot.includes(event.color)) ||
                              EVENT_COLORS[0];
                            return (
                              <EventPill
                                key={event.id}
                                event={event}
                                colorStyle={colorStyle}
                                onClick={() => handleEventClick(event)}
                              />
                            );
                          })}
                        </div>

                        {/* +X more */}
                        {extraCount > 0 && (
                          <button
                            onClick={() => {
                              // Open first hidden event for simplicity
                              if (dayEvents[maxVisible]) {
                                handleEventClick(dayEvents[maxVisible]);
                              }
                            }}
                            className="mt-0.5 w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs text-muted-foreground hover:bg-muted"
                          >
                            +{extraCount} more
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Week view placeholder */
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center">
                  <CalendarIcon className="text-muted-foreground mx-auto mb-3 size-10" />
                  <p className="text-muted-foreground text-sm">Week view coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="hidden lg:block"
          >
            <Card>
              <CardContent className="pt-6">
                <MiniCalendar
                  currentMonth={currentMonth}
                  selectedDate={null}
                  onDateSelect={() => {}}
                  events={events}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="hidden lg:block"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingEvents events={upcomingEvents} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <EventDialog
        event={selectedEvent}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
      />
    </motion.div>
  );
}