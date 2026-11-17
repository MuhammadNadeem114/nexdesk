import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: List all projects with member count and task count
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

    const projects = await db.project.findMany({
      where: { organizationId: orgMember.organizationId },
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        teams: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new project
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const {
      name,
      description,
      status = 'ACTIVE',
      color = '#6366f1',
      icon,
      startDate,
      endDate,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const orgMember = await db.orgMember.findFirst({
      where: { userId: user!.id },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      );
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        status,
        color,
        icon,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        organizationId: orgMember.organizationId,
        creatorId: user!.id,
      },
      include: {
        _count: {
          select: { members: true, tasks: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Add creator as a project member
    await db.projectMember.create({
      data: {
        userId: user!.id,
        projectId: project.id,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a project by query param id
export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project id is required as a query parameter' },
        { status: 400 }
      );
    }

    // Verify the project belongs to the user's org
    const orgMember = await db.orgMember.findFirst({
      where: { userId: user!.id },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      );
    }

    const project = await db.project.findFirst({
      where: { id, organizationId: orgMember.organizationId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}