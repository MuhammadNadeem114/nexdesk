import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function getSessionUser(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('nexdesk_session')?.value;
  if (!sessionId) return null;
  const user = await db.user.findUnique({
    where: { id: sessionId },
    include: { settings: true },
  });
  return user;
}

export async function requireAuth(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }
  return { error: null, user };
}

export function getOrgId(): string {
  // In production this would be dynamic; for the demo we use a fixed org slug.
  return 'nexdesk-corp';
}

export async function getOrg() {
  return db.organization.findUnique({
    where: { slug: getOrgId() },
  });
}