import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: List user notifications
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {
      userId: user!.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: { userId: user!.id, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { id, markAllAsRead } = body;

    if (markAllAsRead) {
      const result = await db.notification.updateMany({
        where: {
          userId: user!.id,
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json({
        message: `Marked ${result.count} notifications as read`,
        count: result.count,
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Notification id is required (or use markAllAsRead: true)' },
        { status: 400 }
      );
    }

    // Verify the notification belongs to the user
    const notification = await db.notification.findFirst({
      where: { id, userId: user!.id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}