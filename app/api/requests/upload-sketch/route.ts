import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { db } from '@/src/lib/db';
import { ensureUploadDirs, sketchesDir } from '@/src/lib/uploads';
import path from 'path';
import fs from 'fs';
import { IncomingForm, Files } from 'formidable';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  ensureUploadDirs();

  // Prefer web FormData path
  try {
    const formData = await req.formData();
    const requestIdRaw = formData.get('requestId');
    const requestId = Number(requestIdRaw);
    const file = formData.get('file') as unknown as File | null;
    if (!requestId || !file) throw new Error('fallback');
    const arrayBuffer = await (file as unknown as File).arrayBuffer();
    const destName = `${Date.now()}_${path.basename((file as any).name || 'sketch.png')}`;
    const destPath = path.join(sketchesDir, destName);
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    db.prepare('INSERT INTO assets (request_id, kind, filename) VALUES (?, ?, ?)').run(requestId, 'sketch', destName);
    db.prepare("UPDATE requests SET status = 'in_progress' WHERE id = ?").run(requestId);
    return NextResponse.json({ ok: true, filename: destName });
  } catch (_e) {
    // Fallback to formidable
    const contentType = req.headers.get('content-type') || '';
    if (!/multipart\/form-data/i.test(contentType)) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }
    const form = new IncomingForm({ multiples: false, keepExtensions: true });
    const buffer = Buffer.from(await req.arrayBuffer());
    const [fields, files] = await new Promise<[Record<string, any>, Files]>((resolve, reject) => {
      // formidable expects a Node req; use a shim
      // @ts-ignore
      form.parse(
        Object.assign(new (require('stream').Readable)(), {
          headers: Object.fromEntries(req.headers),
          _read() {
            this.push(buffer);
            this.push(null);
          }
        }),
        (err: any, fields: Record<string, any>, files: Files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        }
      );
    });
    const requestId = Number(fields.requestId);
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    let file: any = (files as any).file ?? Object.values(files)[0];
    if (Array.isArray(file)) file = file[0];
    if (!file || !file.filepath) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    const destName = `${Date.now()}_${path.basename(file.originalFilename || 'sketch.png')}`;
    const destPath = path.join(sketchesDir, destName);
    fs.copyFileSync(file.filepath, destPath);
    db.prepare('INSERT INTO assets (request_id, kind, filename) VALUES (?, ?, ?)').run(requestId, 'sketch', destName);
    db.prepare("UPDATE requests SET status = 'in_progress' WHERE id = ?").run(requestId);
    return NextResponse.json({ ok: true, filename: destName });
  }
}


