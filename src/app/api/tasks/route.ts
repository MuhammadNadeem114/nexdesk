import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: List tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');

    // Build the where clause
    const where: Record<string, unknown> = {};

    if (projectId) {
      where.projectId = projectId;
    } else {
      // If no projectId, only show tasks for the user's org
      const orgMember = await db.orgMember.findFirst({
        where: { userId: user!.id },
      });
      if (orgMember) {
        where.project = { organizationId: orgMember.organizationId };
      }
    }

    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        labels: true,
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new task
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const {
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      projectId,
      assigneeId,
      parentId,
      startDate,
      dueDate,
      estimateHours,
      labels,
    } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and projectId are required' },
        { status: 400 }
      );
    }

    // Get max order for the project to append at end
    const maxOrder = await db.task.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    const task = await db.task.create({
      data: {
        title,
        description,
        status,
        priority,
        order: (maxOrder._max.order ?? -1) + 1,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: user!.id,
        parentId: parentId || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimateHours: estimateHours ?? null,
        labels: labels
          ? {
              create: labels.map((label: { name: string; color: string }) => ({
                name: label.name,
                color: label.color,
              })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        labels: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a task or batch update task statuses
export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { id, batchStatus, ...updateFields } = body;

    // Batch status update
    if (batchStatus && Array.isArray(batchStatus)) {
      const results = await db.$transaction(
        batchStatus.map(
          (item: { id: string; status: string }) =>
            db.task.update({
              where: { id: item.id },
              data: { status: item.status },
            })
        )
      );

      return NextResponse.json({ tasks: results });
    }

    // Single task update
    if (!id) {
      return NextResponse.json(
        { error: 'Task id is required' },
        { status: 400 }
      );
    }

    // Build update data from provided fields
    const data: Record<string, unknown> = {};
    if (updateFields.title !== undefined) data.title = updateFields.title;
    if (updateFields.description !== undefined) data.description = updateFields.description;
    if (updateFields.status !== undefined) data.status = updateFields.status;
    if (updateFields.priority !== undefined) data.priority = updateFields.priority;
    if (updateFields.assigneeId !== undefined) data.assigneeId = updateFields.assigneeId || null;
    if (updateFields.order !== undefined) data.order = updateFields.order;
    if (updateFields.startDate !== undefined) data.startDate = updateFields.startDate ? new Date(updateFields.startDate) : null;
    if (updateFields.dueDate !== undefined) data.dueDate = updateFields.dueDate ? new Date(updateFields.dueDate) : null;
    if (updateFields.estimateHours !== undefined) data.estimateHours = updateFields.estimateHours;
    if (updateFields.loggedHours !== undefined) data.loggedHours = updateFields.loggedHours;
    if (updateFields.projectId !== undefined) data.projectId = updateFields.projectId;
    if (updateFields.parentId !== undefined) data.parentId = updateFields.parentId || null;
    if (updateFields.progress !== undefined) data.progress = updateFields.progress;

    const task = await db.task.update({
      where: { id },
      data,
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        labels: true,
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}