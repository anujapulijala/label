import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const baseFolder = process.env.CLOUDINARY_FOLDER || 'anuja';

export const cloudEnabled = !!(cloudName && apiKey && apiSecret);

if (cloudEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

export async function uploadBufferToCloudinary(buffer: Buffer, folder: string, filename?: string) {
  if (!cloudEnabled) throw new Error('Cloudinary not configured');
  const res = await cloudinary.uploader.upload_stream({
    folder: `${baseFolder}/${folder}`,
    public_id: filename ? filename.replace(/\.[a-z0-9]+$/i, '') : undefined,
    resource_type: 'image'
  }, (err, result) => {
    // this callback is handled through the stream wrapper below
  });
  // create stream wrapper
  return await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: `${baseFolder}/${folder}`,
      public_id: filename ? filename.replace(/\.[a-z0-9]+$/i, '') : undefined,
      resource_type: 'image'
    }, (err, result) => {
      if (err || !result) return reject(err);
      resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
    });
    stream.end(buffer);
  });
}

export async function listFolderFromCloudinary(folder: string) {
  if (!cloudEnabled) return [];
  const res = await cloudinary.search
    .expression(`folder:${baseFolder}/${folder}`)
    .sort_by('created_at', 'desc')
    .max_results(100)
    .execute();
  return (res.resources || []).map((r: any) => ({
    secure_url: r.secure_url as string,
    public_id: r.public_id as string,
    filename: r.public_id.split('/').pop() as string
  }));
}

export async function destroyFromCloudinary(publicId: string) {
  if (!cloudEnabled) return { ok: false, skipped: true };
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  return { ok: true };
}


