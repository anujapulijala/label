import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/src/lib/session';
import { db } from '@/src/lib/db';
import { aiDir, sketchesDir, ensureUploadDirs } from '@/src/lib/uploads';
import path from 'path';
import fs from 'fs';
import { generateAiIllustrationFromSketch } from '@/src/lib/ai';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { requestId, primaryColor, prompt } = await req.json();
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

  ensureUploadDirs();
  const sketch = db.prepare(`SELECT * FROM assets WHERE request_id = ? AND kind = 'sketch' ORDER BY created_at DESC LIMIT 1`).get(requestId);
  if (!sketch) return NextResponse.json({ error: 'No sketch found for this request' }, { status: 404 });
  const sketchPath = path.join(sketchesDir, sketch.filename);
  if (!fs.existsSync(sketchPath)) return NextResponse.json({ error: 'Sketch file missing' }, { status: 404 });

  const aiName = await generateAiIllustrationFromSketch(sketchPath, { primaryColor, prompt });
  db.prepare('INSERT INTO assets (request_id, kind, filename) VALUES (?, ?, ?)').run(requestId, 'ai', aiName);
  db.prepare("UPDATE requests SET status = 'ai_ready' WHERE id = ?").run(requestId);
  return NextResponse.json({ ok: true, filename: aiName, url: `/api/uploads?type=ai&name=${encodeURIComponent(aiName)}` });
}


