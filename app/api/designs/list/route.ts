import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { designsUploadDir, ensureUploadDirs } from '@/src/lib/uploads';

export async function GET() {
  const designsDir = path.join(process.cwd(), 'designs');
  let files: string[] = [];
  try {
    files = fs.readdirSync(designsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  } catch {
    files = [];
  }
  ensureUploadDirs();
  let uploaded: string[] = [];
  try {
    uploaded = fs.readdirSync(designsUploadDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  } catch {
    uploaded = [];
  }
  const stock = files.map((f) => {
    const name = path.parse(f).name;
    return {
      name,
      filename: f,
      url: `/api/designs/image?file=${encodeURIComponent(f)}`
    };
  });
  const up = uploaded.map(f => {
    const name = path.parse(f).name;
    return {
      name,
      filename: f,
      url: `/api/uploads?type=design&name=${encodeURIComponent(f)}`
    };
  });
  return NextResponse.json({ items: [...up, ...stock] });
}


