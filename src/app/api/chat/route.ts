import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: List channels OR get messages for a specific channel
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    const orgMember = await db.orgMember.findFirst({
      where: { userId: user!.id },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      );
    }

    // If channelId is provided, return messages for that channel
    if (channelId) {
      const messages = await db.message.findMany({
        where: { channelId },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
          attachments: {
            select: { id: true, name: true, url: true, size: true, mimeType: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // Limit to last 100 messages
      });

      return NextResponse.json({ messages });
    }

    // Otherwise, return the list of channels
    const channels = await db.channel.findMany({
      where: { organizationId: orgMember.organizationId },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
        members: {
          where: { userId: user!.id },
          select: { lastRead: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add unread count for each channel
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        const lastRead = channel.members[0]?.lastRead;
        const unreadCount = lastRead
          ? await db.message.count({
              where: {
                channelId: channel.id,
                createdAt: { gt: lastRead },
                senderId: { not: user!.id },
              },
            })
          : await db.message.count({
              where: {
                channelId: channel.id,
                senderId: { not: user!.id },
              },
            });

        return {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          description: channel.description,
          memberCount: channel._count.members,
          messageCount: channel._count.messages,
          unreadCount,
          lastRead: channel.members[0]?.lastRead ?? null,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
        };
      })
    );

    return NextResponse.json({ channels: channelsWithUnread });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Send a message or create a new channel
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { channelId, content, type = 'TEXT', name, description, channelType = 'PUBLIC' } = body;

    const orgMember = await db.orgMember.findFirst({
      where: { userId: user!.id },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      );
    }

    // If name is provided, create a new channel
    if (name) {
      const channel = await db.channel.create({
        data: {
          name,
          type: channelType,
          description: description || null,
          organizationId: orgMember.organizationId,
        },
        include: {
          _count: {
            select: { members: true, messages: true },
          },
        },
      });

      // Add the creator as a channel member
      await db.channelMember.create({
        data: {
          userId: user!.id,
          channelId: channel.id,
        },
      });

      return NextResponse.json({ channel }, { status: 201 });
    }

    // Otherwise, send a message to an existing channel
    if (!channelId || !content) {
      return NextResponse.json(
        { error: 'channelId and content are required to send a message' },
        { status: 400 }
      );
    }

    // Verify the user is a member of the channel
    const membership = await db.channelMember.findFirst({
      where: { userId: user!.id, channelId },
    });

    if (!membership) {
      // Auto-join public channels
      const channel = await db.channel.findFirst({
        where: { id: channelId, organizationId: orgMember.organizationId },
      });

      if (!channel) {
        return NextResponse.json(
          { error: 'Channel not found' },
          { status: 404 }
        );
      }

      await db.channelMember.create({
        data: { userId: user!.id, channelId },
      });
    }

    const message = await db.message.create({
      data: {
        content,
        type,
        channelId,
        senderId: user!.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}