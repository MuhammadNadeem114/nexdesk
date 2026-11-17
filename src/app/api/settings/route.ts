import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Get user settings
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    // Settings are already included via the auth helper
    let settings = user!.settings;

    if (!settings) {
      // Create default settings if they don't exist
      settings = await db.userSetting.create({
        data: { userId: user!.id },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update user settings
export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { theme, language, sidebarCollapsed } = body;

    // Build update data from provided fields only
    const data: Record<string, unknown> = {};
    if (theme !== undefined) data.theme = theme;
    if (language !== undefined) data.language = language;
    if (sidebarCollapsed !== undefined) data.sidebarCollapsed = sidebarCollapsed;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Provide theme, language, or sidebarCollapsed.' },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await db.userSetting.upsert({
      where: { userId: user!.id },
      update: data,
      create: {
        userId: user!.id,
        ...data,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}