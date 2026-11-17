import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: List files and folders
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

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

    // Build folder filter
    const folderWhere: Record<string, unknown> = {
      organizationId: orgId,
      parentId: folderId || null,
    };

    const fileWhere: Record<string, unknown> = {
      organizationId: orgId,
      folderId: folderId || null,
    };

    const [folders, files] = await Promise.all([
      db.folder.findMany({
        where: folderWhere,
        include: {
          _count: {
            select: { children: true, files: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.file.findMany({
        where: fileWhere,
        include: {
          uploadedBy: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        childCount: f._count.children,
        fileCount: f._count.files,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      files,
    });
  } catch (error) {
    console.error('Files GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new folder
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
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

    // If parentId is provided, verify the parent folder exists and belongs to the org
    if (parentId) {
      const parentFolder = await db.folder.findFirst({
        where: { id: parentId, organizationId: orgMember.organizationId },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }
    }

    const folder = await db.folder.create({
      data: {
        name,
        parentId: parentId || null,
        organizationId: orgMember.organizationId,
      },
      include: {
        _count: {
          select: { children: true, files: true },
        },
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Files POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}