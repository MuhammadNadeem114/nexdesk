import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

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

    // Run all analytics queries in parallel
    const [
      tasksByPriority,
      tasksByStatus,
      allProjects,
      teamPerformance,
    ] = await Promise.all([
      // Tasks grouped by priority
      db.task.groupBy({
        by: ['priority'],
        where: {
          project: { organizationId: orgId },
        },
        _count: { priority: true },
      }),

      // Tasks grouped by status
      db.task.groupBy({
        by: ['status'],
        where: {
          project: { organizationId: orgId },
        },
        _count: { status: true },
      }),

      // All projects with task counts for progress calculation
      db.project.findMany({
        where: { organizationId: orgId },
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),

      // Team members with completed task counts
      db.user.findMany({
        where: {
          organizations: { some: { organizationId: orgId } },
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          jobTitle: true,
          department: true,
          _count: {
            select: {
              assignedTasks: {
                where: {
                  project: { organizationId: orgId },
                  status: 'DONE',
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate project progress
    const projectProgress = await Promise.all(
      allProjects.map(async (project) => {
        const doneTasks = await db.task.count({
          where: {
            projectId: project.id,
            status: 'DONE',
          },
        });
        const totalTasks = project._count.tasks;
        const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return {
          id: project.id,
          name: project.name,
          color: project.color,
          status: project.status,
          totalTasks,
          completedTasks: doneTasks,
          progress,
        };
      })
    );

    // Format team performance
    const formattedTeamPerformance = teamPerformance.map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      jobTitle: member.jobTitle,
      department: member.department,
      completedTasks: member._count.assignedTasks,
    }));

    // Hardcoded demo data
    const productivityTrend = [12, 19, 15, 22, 18, 25, 21, 28];
    const revenueByMonth = [12400, 15800, 13200, 18900, 16500, 21000];

    return NextResponse.json({
      tasksByPriority: tasksByPriority.map((item) => ({
        priority: item.priority,
        count: item._count.priority,
      })),
      tasksByStatus: tasksByStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      projectProgress,
      teamPerformance: formattedTeamPerformance,
      productivityTrend,
      revenueByMonth,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}