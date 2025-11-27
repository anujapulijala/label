import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ensureUploadDirs, outfitsDir } from '@/src/lib/uploads';
import { cloudEnabled, listFolderFromCloudinary } from '@/src/lib/cloud';

export async function GET() {
  ensureUploadDirs();
  let files: string[] = [];
  try {
    files = fs.readdirSync(outfitsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  } catch {
    files = [];
  }
  let items = files.map((f) => ({
    name: path.parse(f).name,
    filename: f,
    url: `/api/uploads?type=outfit&name=${encodeURIComponent(f)}`
  }));
  if (cloudEnabled) {
    try {
      const cloud = await listFolderFromCloudinary('outfits');
      items = cloud.map((c: any) => ({
        name: path.parse(c.filename).name,
        filename: c.public_id,
        url: c.secure_url
      }));
    } catch {}
  }
  return NextResponse.json({ items });
}


