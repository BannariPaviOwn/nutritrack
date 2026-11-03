export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  // Dev fallback so local mode works without .env; replace in production.
  return "nutritrack-dev-secret-change-me";
}

export function dataModeLabel(): "supabase" | "local" {
  return isSupabaseConfigured() ? "supabase" : "local";
}
