import { NextResponse } from 'next/server';
import { queryMany } from '@/src/lib/db';

export async function GET() {
  const items = await queryMany<any>(`
    SELECT r.*, u.name, u.username
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `);
  return NextResponse.json({ items });
}


