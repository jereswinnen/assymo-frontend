import { put, del } from "@vercel/blob";

export interface UploadedImage {
  url: string;
  filename: string;
}

/**
 * Upload an image to Vercel Blob storage
 * @param file - The file to upload
 * @returns The uploaded image URL and filename
 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const blob = await put(file.name, file, { access: "public" });
  return { url: blob.url, filename: file.name };
}

/**
 * Delete an image from Vercel Blob storage
 * @param url - The blob URL to delete
 */
export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
