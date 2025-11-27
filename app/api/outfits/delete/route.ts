import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { outfitsDir } from '@/src/lib/uploads';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { filename } = await req.json();
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  const fp = path.join(outfitsDir, path.basename(filename));
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  return NextResponse.json({ ok: true });
}


