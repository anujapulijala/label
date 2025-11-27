import { NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: session });
}


