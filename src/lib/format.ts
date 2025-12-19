/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format date string to Dutch short format (e.g., "15 jan. 2025")
 */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date string to Dutch format with time (e.g., "15 jan. 2025, 14:30")
 */
export function formatDateWithTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
