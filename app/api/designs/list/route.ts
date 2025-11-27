import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { designsUploadDir, ensureUploadDirs } from '@/src/lib/uploads';
import { cloudEnabled, listFolderFromCloudinary } from '@/src/lib/cloud';

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
  let up = uploaded.map(f => {
    const name = path.parse(f).name;
    return {
      name,
      filename: f,
      url: `/api/uploads?type=design&name=${encodeURIComponent(f)}`
    };
  });
  if (cloudEnabled) {
    try {
      const cloud = await listFolderFromCloudinary('designs');
      up = cloud.map((c: any) => ({
        name: path.parse(c.filename).name,
        filename: c.public_id,
        url: c.secure_url
      }));
    } catch {}
  }
  return NextResponse.json({ items: [...up, ...stock] });
}


