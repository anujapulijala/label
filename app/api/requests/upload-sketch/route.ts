import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { queryOne, run } from '@/src/lib/db';
import { ensureUploadDirs, sketchesDir } from '@/src/lib/uploads';
import path from 'path';
import fs from 'fs';
import { IncomingForm, Files } from 'formidable';
import { sendMail } from '@/src/lib/mailer';
import { formidableShimFromRequestHeaders } from '@/src/lib/formidableShim';

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
    await run('INSERT INTO assets (request_id, kind, filename) VALUES (?, ?, ?)', requestId, 'sketch', destName);
    await run("UPDATE requests SET status = 'in_progress' WHERE id = ?", requestId);
    try {
      const reqRow = await queryOne<any>(`SELECT r.*, u.email, u.name FROM requests r JOIN users u ON u.id = r.user_id WHERE r.id = ?`, requestId);
      if (reqRow?.email) {
        await sendMail({
          to: reqRow.email,
          subject: `Your request #${requestId} is now In Progress`,
          html: `<p>Hi ${reqRow.name || ''},</p><p>Your request <b>#${requestId}</b> is now <b>In Progress</b>. I've uploaded an initial sketch for your review.</p><p>Best,<br/>Anuja</p>`,
          attachments: [{ filename: path.basename(destPath), path: destPath }]
        });
      }
    } catch {}
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
      const shim: any = formidableShimFromRequestHeaders(req.headers as any, buffer);
      form.parse(shim, (err: any, fields: Record<string, any>, files: Files) => {
        if (err) reject(err); else resolve([fields, files]);
      });
    });
    const requestId = Number(fields.requestId);
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    let file: any = (files as any).file ?? Object.values(files)[0];
    if (Array.isArray(file)) file = file[0];
    if (!file || !file.filepath) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    const destName = `${Date.now()}_${path.basename(file.originalFilename || 'sketch.png')}`;
    const destPath = path.join(sketchesDir, destName);
    fs.copyFileSync(file.filepath, destPath);
    await run('INSERT INTO assets (request_id, kind, filename) VALUES (?, ?, ?)', requestId, 'sketch', destName);
    await run("UPDATE requests SET status = 'in_progress' WHERE id = ?", requestId);
    try {
      const reqRow = await queryOne<any>(`SELECT r.*, u.email, u.name FROM requests r JOIN users u ON u.id = r.user_id WHERE r.id = ?`, requestId);
      if (reqRow?.email) {
        await sendMail({
          to: reqRow.email,
          subject: `Your request #${requestId} is now In Progress`,
          html: `<p>Hi ${reqRow.name || ''},</p><p>Your request <b>#${requestId}</b> is now <b>In Progress</b>. I've uploaded an initial sketch for your review.</p><p>Best,<br/>Anuja</p>`,
          attachments: [{ filename: path.basename(destPath), path: destPath }]
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, filename: destName });
  }
}


