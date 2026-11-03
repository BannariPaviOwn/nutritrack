import {
  MEAL_PHOTO_JPEG_QUALITY,
  MEAL_PHOTO_LONG_EDGE,
  MEAL_PHOTO_MAX_BYTES,
  MEAL_PHOTO_TARGET_BYTES,
} from "@/lib/meal-photo-limits";

export type CompressMealPhotoResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  didCompress: boolean;
};

function jpegName(name: string): string {
  return name.replace(/\.\w+$/, "") + ".jpg";
}

async function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

/**
 * Resize (long edge ≤ MEAL_PHOTO_LONG_EDGE) and re-encode as JPEG for upload.
 * Skips GIFs. Falls back to the original file if canvas encoding fails.
 */
export async function compressMealPhoto(file: File): Promise<CompressMealPhotoResult> {
  const originalBytes = file.size;

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      didCompress: false,
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MEAL_PHOTO_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return {
        file,
        originalBytes,
        compressedBytes: originalBytes,
        didCompress: false,
      };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const qualities = [MEAL_PHOTO_JPEG_QUALITY, 0.65, 0.55];
    let best: Blob | null = null;

    for (const quality of qualities) {
      const blob = await canvasToJpegBlob(canvas, quality);
      if (!blob) continue;
      best = blob;
      if (blob.size <= MEAL_PHOTO_TARGET_BYTES) break;
      if (blob.size <= MEAL_PHOTO_MAX_BYTES && quality <= 0.65) break;
    }

    if (!best) {
      return {
        file,
        originalBytes,
        compressedBytes: originalBytes,
        didCompress: false,
      };
    }

    // Keep original when it is already small enough and compression did not help.
    if (
      best.size >= originalBytes &&
      originalBytes <= MEAL_PHOTO_MAX_BYTES &&
      scale === 1 &&
      (file.type === "image/jpeg" || file.type === "image/jpg")
    ) {
      return {
        file,
        originalBytes,
        compressedBytes: originalBytes,
        didCompress: false,
      };
    }

    const compressed = new File([best], jpegName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return {
      file: compressed,
      originalBytes,
      compressedBytes: compressed.size,
      didCompress: true,
    };
  } catch {
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      didCompress: false,
    };
  }
}

export function formatPhotoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(2) : mb.toFixed(1)} MB`;
}
