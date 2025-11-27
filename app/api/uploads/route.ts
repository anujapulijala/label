import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { aiDir, sketchesDir, designsUploadDir, outfitsDir, reviewsDir } from '@/src/lib/uploads';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const name = searchParams.get('name');
  if (!type || !name) return new NextResponse('Bad Request', { status: 400 });
  const base = type === 'sketch' ? sketchesDir
    : type === 'design' ? designsUploadDir
    : type === 'outfit' ? outfitsDir
    : type === 'review' ? reviewsDir
    : aiDir;
  const filePath = path.join(base, path.basename(name));
  if (!fs.existsSync(filePath)) return new NextResponse('Not Found', { status: 404 });
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);
  const typeHeader = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': typeHeader,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=3600'
    }
  });
}


