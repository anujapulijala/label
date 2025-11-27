import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { designsUploadDir, ensureUploadDirs } from '@/src/lib/uploads';
import { IncomingForm, Files } from 'formidable';
import path from 'path';
import fs from 'fs';
import { db } from '@/src/lib/db';
import { sendMail } from '@/src/lib/mailer';
import { formidableShimFromRequestHeaders } from '@/src/lib/formidableShim';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  ensureUploadDirs();

  // Try native FormData first
  try {
    const formData = await req.formData();
    const file = formData.get('file') as unknown as File | null;
    if (!file) throw new Error('fallback');
    const arrayBuffer = await (file as unknown as File).arrayBuffer();
    const destName = `${Date.now()}_${path.basename((file as any).name || 'design.jpg')}`;
    const destPath = path.join(designsUploadDir, destName);
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    try {
      const rows = db.prepare(`SELECT email FROM users WHERE email IS NOT NULL`).all() as { email: string }[];
      const emails = rows.map(r => r.email).filter(Boolean);
      if (emails.length) {
        await sendMail({
          to: emails,
          subject: 'New design added',
          html: `<p>A new design has been added to the gallery.</p><p>Visit the gallery to see it, or preview below.</p>`,
          attachments: [{ filename: destName, path: destPath }]
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, filename: destName, url: `/api/uploads?type=design&name=${encodeURIComponent(destName)}` });
  } catch {
    // Fallback to formidable for older clients
    const ctype = req.headers.get('content-type') || '';
    if (!/multipart\/form-data/i.test(ctype)) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }
    const form = new IncomingForm({ multiples: false, keepExtensions: true });
    const buffer = Buffer.from(await req.arrayBuffer());
    const [fields, files] = await new Promise<[Record<string, any>, Files]>((resolve, reject) => {
      const shim: any = formidableShimFromRequestHeaders(req.headers as any, buffer);
      form.parse(shim, (err: any, fields: Record<string, any>, files: Files) => {
        if (err) reject(err); else resolve([fields, files]);
      });
    });
    let file: any = (files as any).file ?? Object.values(files)[0];
    if (Array.isArray(file)) file = file[0];
    if (!file || !file.filepath) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    const destName = `${Date.now()}_${path.basename(file.originalFilename || 'design.jpg')}`;
    const destPath = path.join(designsUploadDir, destName);
    fs.copyFileSync(file.filepath, destPath);
    try {
      const rows = db.prepare(`SELECT email FROM users WHERE email IS NOT NULL`).all() as { email: string }[];
      const emails = rows.map(r => r.email).filter(Boolean);
      if (emails.length) {
        await sendMail({
          to: emails,
          subject: 'New design added',
          html: `<p>A new design has been added to the gallery.</p><p>Visit the gallery to see it, or preview below.</p>`,
          attachments: [{ filename: destName, path: destPath }]
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, filename: destName, url: `/api/uploads?type=design&name=${encodeURIComponent(destName)}` });
  }
}


