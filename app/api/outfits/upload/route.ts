import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { outfitsDir, ensureUploadDirs } from '@/src/lib/uploads';
import path from 'path';
import fs from 'fs';
import { IncomingForm, Files } from 'formidable';
import { db } from '@/src/lib/db';
import { sendMail } from '@/src/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  ensureUploadDirs();
  try {
    const fd = await req.formData();
    const file = fd.get('file') as unknown as File | null;
    if (!file) throw new Error('fallback');
    const ab = await (file as any).arrayBuffer();
    const destName = `${Date.now()}_${path.basename((file as any).name || 'outfit.jpg')}`;
    const full = path.join(outfitsDir, destName);
    fs.writeFileSync(full, Buffer.from(ab));
    try {
      const rows = db.prepare(`SELECT email FROM users WHERE email IS NOT NULL`).all() as { email: string }[];
      const emails = rows.map(r => r.email).filter(Boolean);
      if (emails.length) {
        await sendMail({
          to: emails,
          subject: 'New outfit added to Portfolio',
          html: `<p>A new outfit has been added to the portfolio.</p><p>Visit the Portfolio page to see it, or preview below.</p>`,
          attachments: [{ filename: destName, path: full }]
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, filename: destName, url: `/api/uploads?type=outfit&name=${encodeURIComponent(destName)}` });
  } catch {
    const ctype = req.headers.get('content-type') || '';
    if (!/multipart\/form-data/i.test(ctype)) return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    const form = new IncomingForm({ multiples: false, keepExtensions: true });
    const buffer = Buffer.from(await req.arrayBuffer());
    const [fields, files] = await new Promise<[Record<string, any>, Files]>((resolve, reject) => {
      // @ts-ignore
      form.parse(Object.assign(new (require('stream').Readable)(), {
        headers: Object.fromEntries(req.headers),
        _read() { this.push(buffer); this.push(null); }
      }), (err: any, fields: Record<string, any>, files: Files) => {
        if (err) reject(err); else resolve([fields, files]);
      });
    });
    let file: any = (files as any).file ?? Object.values(files)[0];
    if (Array.isArray(file)) file = file[0];
    if (!file || !file.filepath) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    const destName = `${Date.now()}_${path.basename(file.originalFilename || 'outfit.jpg')}`;
    const full = path.join(outfitsDir, destName);
    fs.copyFileSync(file.filepath, full);
    try {
      const rows = db.prepare(`SELECT email FROM users WHERE email IS NOT NULL`).all() as { email: string }[];
      const emails = rows.map(r => r.email).filter(Boolean);
      if (emails.length) {
        await sendMail({
          to: emails,
          subject: 'New outfit added to Portfolio',
          html: `<p>A new outfit has been added to the portfolio.</p><p>Visit the Portfolio page to see it, or preview below.</p>`,
          attachments: [{ filename: destName, path: full }]
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, filename: destName, url: `/api/uploads?type=outfit&name=${encodeURIComponent(destName)}` });
  }
}


