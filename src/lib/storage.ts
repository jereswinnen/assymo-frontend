import { put, del, head } from "@vercel/blob";

export interface UploadedImage {
  url: string;
  filename: string;
}

export interface BlobInfo {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
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
 * Get blob info from Vercel Blob storage
 * @param url - The blob URL
 * @returns The blob info
 */
export async function getBlobInfo(url: string): Promise<BlobInfo> {
  const blob = await head(url);
  return {
    url: blob.url,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  };
}

/**
 * Delete an image from Vercel Blob storage
 * @param url - The blob URL to delete
 */
export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
