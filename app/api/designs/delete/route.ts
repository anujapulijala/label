import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { designsUploadDir } from '@/src/lib/uploads';
import { cloudEnabled, destroyFromCloudinary } from '@/src/lib/cloud';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { filename } = await req.json();
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  if (cloudEnabled && filename.includes('/')) {
    // client will pass public_id when using cloud list; accept either public_id or url
    const publicId = filename.includes('/') && !filename.endsWith('.jpg') && !filename.endsWith('.png')
      ? filename
      : filename.replace(/^.*upload\/(?:v\d+\/)?/, '').replace(/\.[a-z0-9]+$/i, '');
    try { await destroyFromCloudinary(publicId); } catch {}
  } else {
    const filePath = path.join(designsUploadDir, path.basename(filename));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  return NextResponse.json({ ok: true });
}


