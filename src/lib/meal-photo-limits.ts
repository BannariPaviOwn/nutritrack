/** Hard max for saved/uploaded meal photos (after client compress). */
export const MEAL_PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
/** Soft target size after client-side compress. */
export const MEAL_PHOTO_TARGET_BYTES = 800 * 1024; // 800 KB
/** Max long-edge pixels for client resize. */
export const MEAL_PHOTO_LONG_EDGE = 1280;
/** Default JPEG quality for client re-encode. */
export const MEAL_PHOTO_JPEG_QUALITY = 0.72;
/**
 * Max original pick size on the client before compress.
 * Phone cameras often exceed the hard max; we compress then enforce MEAL_PHOTO_MAX_BYTES.
 */
export const MEAL_PHOTO_PICK_MAX_BYTES = 15 * 1024 * 1024; // 15 MB
