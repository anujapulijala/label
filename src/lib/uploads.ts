import fs from 'fs';
import path from 'path';

const storageRoot = process.env.STORAGE_ROOT || process.cwd();
export const uploadsRoot = path.join(storageRoot, 'uploads');
export const sketchesDir = path.join(uploadsRoot, 'sketches');
export const aiDir = path.join(uploadsRoot, 'ai');
export const designsUploadDir = path.join(uploadsRoot, 'designs');
export const outfitsDir = path.join(uploadsRoot, 'outfits');
export const reviewsDir = path.join(uploadsRoot, 'reviews');

export function ensureUploadDirs() {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });
  if (!fs.existsSync(sketchesDir)) fs.mkdirSync(sketchesDir, { recursive: true });
  if (!fs.existsSync(aiDir)) fs.mkdirSync(aiDir, { recursive: true });
  if (!fs.existsSync(designsUploadDir)) fs.mkdirSync(designsUploadDir, { recursive: true });
  if (!fs.existsSync(outfitsDir)) fs.mkdirSync(outfitsDir, { recursive: true });
  if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir, { recursive: true });
}


