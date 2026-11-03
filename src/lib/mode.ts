/**
 * Data backend selection.
 *
 * DATA_MODE=local (default) — always use the JSON store, even if Supabase
 * env vars are present on Vercel. Opt into Supabase with DATA_MODE=supabase
 * (and valid NEXT_PUBLIC_SUPABASE_* keys).
 */
export type DataMode = "local" | "supabase";

export function getDataMode(): DataMode {
  const raw = process.env.DATA_MODE?.trim().toLowerCase();
  if (raw === "supabase") return "supabase";
  // Explicit local, empty, or anything else → local (safe default).
  return "local";
}

export function isSupabaseConfigured(): boolean {
  if (getDataMode() !== "supabase") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  // Dev / demo fallback so local mode boots without .env.
  // Production (Vercel) should set AUTH_SECRET explicitly.
  if (process.env.VERCEL) {
    console.warn(
      "[nutritrack] AUTH_SECRET is not set on Vercel; using insecure fallback. Set AUTH_SECRET in project env.",
    );
  }
  return "nutritrack-dev-secret-change-me";
}

export function dataModeLabel(): "supabase" | "local" {
  return isSupabaseConfigured() ? "supabase" : "local";
}

export function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}
