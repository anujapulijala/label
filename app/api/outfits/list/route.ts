import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ensureUploadDirs, outfitsDir } from '@/src/lib/uploads';

export async function GET() {
  ensureUploadDirs();
  let files: string[] = [];
  try {
    files = fs.readdirSync(outfitsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  } catch {
    files = [];
  }
  const items = files.map((f) => ({
    name: path.parse(f).name,
    filename: f,
    url: `/api/uploads?type=outfit&name=${encodeURIComponent(f)}`
  }));
  return NextResponse.json({ items });
}


