import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    // Get the org for the current user
    const orgMember = await db.orgMember.findFirst({
      where: { userId: user!.id },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      );
    }

    const orgId = orgMember.organizationId;

    // Run all queries in parallel for performance
    const [
      totalProjects,
      activeProjects,
      completedTasks,
      totalTasks,
      teamSize,
      recentActivity,
      upcomingMeetings,
      recentNotifications,
      tasksByStatus,
    ] = await Promise.all([
      // Total projects
      db.project.count({ where: { organizationId: orgId } }),

      // Active projects
      db.project.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),

      // Completed tasks
      db.task.count({
        where: {
          project: { organizationId: orgId },
          status: 'DONE',
        },
      }),

      // Total tasks
      db.task.count({
        where: {
          project: { organizationId: orgId },
        },
      }),

      // Team size (org members)
      db.orgMember.count({ where: { organizationId: orgId } }),

      // Recent activity (last 10)
      db.activityLog.findMany({
        where: { organizationId: orgId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),

      // Upcoming meetings (next 5 from now)
      db.meeting.findMany({
        where: {
          organizationId: orgId,
          startTime: { gte: new Date() },
        },
        take: 5,
        orderBy: { startTime: 'asc' },
        include: {
          creator: {
            select: { id: true, name: true, avatar: true },
          },
          attendees: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
        },
      }),

      // Recent unread notifications
      db.notification.findMany({
        where: {
          userId: user!.id,
          read: false,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // Task status distribution
      db.task.groupBy({
        by: ['status'],
        where: {
          project: { organizationId: orgId },
        },
        _count: { status: true },
      }),
    ]);

    // Format task status distribution
    const taskStatusDistribution = tasksByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Hardcoded demo revenue data for last 6 months
    const revenueData = [12400, 15800, 13200, 18900, 16500, 21000];

    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedTasks,
      totalTasks,
      teamSize,
      recentActivity,
      upcomingMeetings,
      recentNotifications,
      taskStatusDistribution,
      revenueData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}