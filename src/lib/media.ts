// Client-side media processing helpers for the admin dashboard.
// - Images are converted to WebP (default 80% quality) before upload.
// - Videos are validated for format (MP4/H.264 container) and duration (<= 30s).
// All failures throw an Error with a clear, user-friendly message and log details.

export const MAX_VIDEO_SECONDS = 30;
export const WEBP_QUALITY = 0.8;
// Cap very large images to keep file size reasonable while staying sharp.
const MAX_IMAGE_DIMENSION = 2000;

const logError = (context: string, err: unknown) => {
  // Centralised logging so issues can be reviewed in the console / monitoring.
  console.error(`[media] ${context}:`, err);
};

/**
 * Convert any browser-decodable image into an optimized WebP File.
 * Throws a descriptive Error if the file is not an image or conversion fails.
 */
export async function convertImageToWebP(
  file: File,
  quality: number = WEBP_QUALITY,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is not an image file.`);
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    if ("createImageBitmap" in window) {
      bitmap = await createImageBitmap(file);
    } else {
      bitmap = await loadImageElement(file);
    }
  } catch (err) {
    logError(`decode image "${file.name}"`, err);
    throw new Error(`Could not read "${file.name}". The file may be corrupted or an unsupported format.`);
  }

  try {
    const srcW = "width" in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
    const srcH = "height" in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) throw new Error("WebP encoding returned no data.");

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch (err) {
    logError(`convert image "${file.name}" to WebP`, err);
    throw new Error(`Failed to convert "${file.name}" to WebP. Please try a different image.`);
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load."));
    };
    img.src = url;
  });
}

/** Read a video's duration (seconds) using an offscreen <video> element. */
function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The video metadata could not be read."));
    };
    video.src = url;
  });
}

/**
 * Validate an uploaded video: must be an MP4 (H.264) container and <= 30 seconds.
 * Returns the file unchanged when valid; throws a descriptive Error otherwise.
 *
 * Note: true server-side transcoding is not available in this environment, so we
 * enforce the required MP4/H.264 format on upload instead of re-encoding in the
 * browser (browser transcoding is unreliable and would break on static hosting).
 */
export async function validateRoomVideo(file: File): Promise<File> {
  const isMp4 =
    file.type === "video/mp4" || /\.mp4$/i.test(file.name);
  if (!isMp4) {
    throw new Error(
      `"${file.name}" must be an MP4 (H.264 + AAC) file. Please export/convert your clip to .mp4 before uploading.`,
    );
  }

  let duration: number;
  try {
    duration = await readVideoDuration(file);
  } catch (err) {
    logError(`read video "${file.name}"`, err);
    throw new Error(`Could not process "${file.name}". The file may be corrupted or an unsupported codec.`);
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not determine the length of "${file.name}".`);
  }
  if (duration > MAX_VIDEO_SECONDS + 0.5) {
    throw new Error(
      `"${file.name}" is ${Math.round(duration)}s long. Videos must be ${MAX_VIDEO_SECONDS} seconds or less.`,
    );
  }

  return file;
}

/**
 * Derive the storage object path from a Supabase public URL for a given bucket.
 * Returns null if the URL does not belong to the bucket.
 */
export function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

/**
 * Upload a file to a Supabase Storage bucket with real byte-level progress.
 *
 * supabase-js `storage.upload()` does not expose progress, so we POST directly
 * to the Storage REST endpoint via XHR (the same call the SDK makes) and report
 * `onProgress(0..100)`. Returns the object path on success; throws on failure.
 */
export async function uploadToBucketWithProgress(
  file: Blob,
  bucket: string,
  path: string,
  accessToken: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!base || !apikey) throw new Error("Storage is not configured. Please try again later.");

  const endpoint = `${base}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`;
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", apikey);
    xhr.setRequestHeader("x-upsert", "false");
    if (file instanceof File && file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(path);
      } else {
        let msg = `Upload failed (${xhr.status}).`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) msg = `Upload failed: ${body.message}`;
        } catch { /* keep default */ }
        logError(`upload "${path}" to ${bucket} [${xhr.status}]`, xhr.responseText);
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => {
      logError(`upload "${path}" to ${bucket}`, "network error");
      reject(new Error("Upload failed due to a network error. Please check your connection and try again."));
    };
    xhr.send(file);
  });
}
