import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: List all org members with their team memberships and task stats
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

    const members = await db.orgMember.findMany({
      where: { organizationId: orgMember.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
            jobTitle: true,
            department: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // Enrich with team memberships and task stats
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const teamMemberships = await db.teamMember.findMany({
          where: {
            userId: member.user.id,
            team: { organizationId: orgMember.organizationId },
          },
          include: {
            team: {
              select: { id: true, name: true, color: true, description: true },
            },
          },
        });

        const [assignedTasks, completedTasks] = await Promise.all([
          db.task.count({
            where: {
              assigneeId: member.user.id,
              project: { organizationId: orgMember.organizationId },
            },
          }),
          db.task.count({
            where: {
              assigneeId: member.user.id,
              status: 'DONE',
              project: { organizationId: orgMember.organizationId },
            },
          }),
        ]);

        return {
          ...member,
          teams: teamMemberships.map((tm) => tm.team),
          taskStats: {
            assigned: assignedTasks,
            completed: completedTasks,
          },
        };
      })
    );

    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    console.error('Team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}