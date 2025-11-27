import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { db } from '@/src/lib/db';
import { ensureUploadDirs, reviewsDir } from '@/src/lib/uploads';
import path from 'path';
import fs from 'fs';
import { IncomingForm, Files } from 'formidable';
import { formidableShimFromRequestHeaders } from '@/src/lib/formidableShim';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ensureUploadDirs();
  // Try formData first
  try {
    const fd = await req.formData();
    const text = String(fd.get('text') || '').slice(0, 2000);
    const file = fd.get('file') as unknown as File | null;
    let filename: string | null = null;
    if (file) {
      const ab = await (file as any).arrayBuffer();
      filename = `${Date.now()}_${path.basename((file as any).name || 'review.jpg')}`;
      fs.writeFileSync(path.join(reviewsDir, filename), Buffer.from(ab));
    }
    db.prepare('INSERT INTO reviews (user_id, text, filename) VALUES (?, ?, ?)').run(session.userId, text, filename);
    return NextResponse.json({ ok: true });
  } catch {
    const ctype = req.headers.get('content-type') || '';
    if (!/multipart\/form-data/i.test(ctype)) return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    const form = new IncomingForm({ multiples: false, keepExtensions: true });
    const buffer = Buffer.from(await req.arrayBuffer());
    const [fields, files] = await new Promise<[Record<string, any>, Files]>((resolve, reject) => {
      const shim: any = formidableShimFromRequestHeaders(req.headers as any, buffer);
      form.parse(shim, (err: any, fields: Record<string, any>, files: Files) => {
        if (err) reject(err); else resolve([fields, files]);
      });
    });
    let filename: string | null = null;
    let file: any = (files as any).file ?? Object.values(files)[0];
    if (Array.isArray(file)) file = file[0];
    if (file?.filepath) {
      filename = `${Date.now()}_${path.basename(file.originalFilename || 'review.jpg')}`;
      fs.copyFileSync(file.filepath, path.join(reviewsDir, filename));
    }
    const text = String(fields.text || '').slice(0, 2000);
    db.prepare('INSERT INTO reviews (user_id, text, filename) VALUES (?, ?, ?)').run(session.userId, text, filename);
    return NextResponse.json({ ok: true });
  }
}


