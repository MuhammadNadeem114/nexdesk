import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Get the demo organization
    const org = await db.organization.findUnique({
      where: { slug: 'nexdesk-corp' },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 500 }
      );
    }

    // Create user, org membership, and settings in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash: password, // In production, hash with bcrypt
          name,
        },
        include: { settings: true, organizations: true },
      });

      await tx.orgMember.create({
        data: {
          userId: newUser.id,
          organizationId: org.id,
          role: 'EMPLOYEE',
        },
      });

      await tx.userSetting.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    const { passwordHash, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Registration successful',
    });

    response.cookies.set('nexdesk_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}