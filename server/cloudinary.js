/**
 * Cloudinary uploads — public HTTPS URLs for Meta / Instagram APIs.
 */
import fs from 'fs';

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET);
}

function resourceTypeFromMime(mime = '') {
  if (mime.startsWith('video/')) return 'video';
  return 'image';
}

export async function uploadToCloudinary(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary no configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET)');
  }

  const resourceType = resourceTypeFromMime(file.mimetype);
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
  if (!buffer) {
    throw new Error('No se pudo leer el archivo para subir');
  }

  const blob = new Blob([buffer], { type: file.mimetype || 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, file.originalname || 'upload');
  form.append('upload_preset', uploadPreset);
  if (process.env.CLOUDINARY_FOLDER) {
    form.append('folder', process.env.CLOUDINARY_FOLDER);
  }

  const res = await fetch(endpoint, { method: 'POST', body: form });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Cloudinary upload failed');
  }

  return {
    publicUrl: data.secure_url,
    publicId: data.public_id,
    mediaType: resourceType === 'video' ? 'video' : 'image',
    width: data.width,
    height: data.height,
    format: data.format,
  };
}

export function resolveAssetMediaUrl(asset) {
  if (!asset) return null;
  if (asset.publicUrl?.startsWith('https://')) return asset.publicUrl;
  if (asset.url?.startsWith('https://')) return asset.url;
  return null;
}
