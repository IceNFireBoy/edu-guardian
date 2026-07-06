/**
 * Unsigned Cloudinary image upload (same account/preset the note uploader
 * uses). Returns a square, face-cropped thumbnail URL suitable for avatars.
 */

const getCloudName = (): string =>
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbnk6q2k6';
const getUploadPreset = (): string =>
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'edu_guardian';

export const uploadAvatarImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB.');
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', getUploadPreset());

  const res = await fetch(`https://api.cloudinary.com/v1_1/${getCloudName()}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    throw new Error('Image upload failed. Please try again.');
  }
  const data = await res.json();
  const url: string = data.secure_url;

  // Square face-crop transform keeps avatar payloads tiny everywhere they render.
  return url.replace('/upload/', '/upload/w_256,h_256,c_fill,g_face/');
};
