import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return new NextResponse('Bad Request', { status: 400 });
  const designsDir = path.join(process.cwd(), 'designs');
  // Allow safe subpaths like "logo/xyz.png" while preventing traversal
  const requested = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(designsDir, requested);
  if (!filePath.startsWith(designsDir)) {
    return new NextResponse('Bad Request', { status: 400 });
  }
  if (!fs.existsSync(filePath)) return new NextResponse('Not Found', { status: 404 });
  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const type =
    ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.svg' ? 'image/svg+xml'
    : 'image/jpeg';
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': type,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=3600'
    }
  });
}


