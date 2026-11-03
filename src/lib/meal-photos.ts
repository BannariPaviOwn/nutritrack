import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { MEAL_PHOTO_MAX_BYTES } from "@/lib/meal-photo-limits";
import { isSupabaseConfigured, isVercelRuntime } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";

export {
  MEAL_PHOTO_JPEG_QUALITY,
  MEAL_PHOTO_LONG_EDGE,
  MEAL_PHOTO_MAX_BYTES,
  MEAL_PHOTO_PICK_MAX_BYTES,
  MEAL_PHOTO_TARGET_BYTES,
} from "@/lib/meal-photo-limits";

export const MEAL_PHOTOS_BUCKET = "meal-photos";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function mealUploadDir(): string {
  if (isVercelRuntime()) {
    return path.join("/tmp", "nutritrack-uploads", "meals");
  }
  return path.join(process.cwd(), "data", "uploads", "meals");
}

/** Safe local filename: `{userId}_{uuid}.{ext}` (no path separators). */
const LOCAL_FILENAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/i;

export function isAllowedMealPhotoMime(mime: string): boolean {
  return Boolean(ALLOWED_MIME[mime.toLowerCase()]);
}

export function extensionForMime(mime: string): string | null {
  return ALLOWED_MIME[mime.toLowerCase()] ?? null;
}

export function parseLocalMealPhotoFilename(filename: string): {
  userId: string;
  filename: string;
} | null {
  const base = path.basename(filename);
  if (base !== filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return null;
  }
  if (!LOCAL_FILENAME_RE.test(base)) return null;
  const userId = base.slice(0, 36);
  return { userId, filename: base };
}

export function localMealPhotoAbsolutePath(filename: string): string | null {
  const parsed = parseLocalMealPhotoFilename(filename);
  if (!parsed) return null;
  const uploadDir = mealUploadDir();
  const resolved = path.resolve(uploadDir, parsed.filename);
  if (!resolved.startsWith(path.resolve(uploadDir) + path.sep)) return null;
  return resolved;
}

export type MealPhotoUploadResult =
  | { ok: true; photo_url: string }
  | { ok: false; error: string };

/**
 * Persist an optional meal photo. Returns null URL when no file was provided.
 * Caller must already have authenticated the user.
 */
export async function saveMealPhoto(
  userId: string,
  file: File | null,
): Promise<MealPhotoUploadResult | { ok: true; photo_url: null }> {
  if (!file || file.size === 0) {
    return { ok: true, photo_url: null };
  }

  const mime = (file.type || "").toLowerCase();
  const ext = extensionForMime(mime);
  if (!ext) {
    return { ok: false, error: "Photo must be JPEG, PNG, WebP, or GIF" };
  }
  if (file.size > MEAL_PHOTO_MAX_BYTES) {
    return { ok: false, error: "Photo must be 2 MB or smaller" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MEAL_PHOTO_MAX_BYTES) {
    return { ok: false, error: "Photo must be 2 MB or smaller" };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const objectPath = `${userId}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(MEAL_PHOTOS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mime === "image/jpg" ? "image/jpeg" : mime,
        upsert: false,
      });
    if (error) {
      return {
        ok: false,
        error: `Photo upload failed: ${error.message}`,
      };
    }
    const { data } = supabase.storage.from(MEAL_PHOTOS_BUCKET).getPublicUrl(objectPath);
    return { ok: true, photo_url: data.publicUrl };
  }

  const filename = `${userId}_${randomUUID()}.${ext}`;
  const abs = localMealPhotoAbsolutePath(filename);
  if (!abs) {
    return { ok: false, error: "Could not save photo" };
  }
  try {
    await fs.mkdir(mealUploadDir(), { recursive: true });
    await fs.writeFile(abs, buffer);
  } catch {
    return {
      ok: false,
      error: isVercelRuntime()
        ? "Photo upload is unavailable on this host right now. Log the meal without a photo, or run locally."
        : "Could not save photo to disk",
    };
  }
  return { ok: true, photo_url: `/api/meal-photos/${filename}` };
}

/** Best-effort delete for local files referenced by `/api/meal-photos/...`. */
export async function deleteLocalMealPhoto(photoUrl: string | null | undefined): Promise<void> {
  if (!photoUrl || !photoUrl.startsWith("/api/meal-photos/")) return;
  const filename = photoUrl.slice("/api/meal-photos/".length);
  const abs = localMealPhotoAbsolutePath(filename);
  if (!abs) return;
  try {
    await fs.unlink(abs);
  } catch {
    // ignore missing file
  }
}
