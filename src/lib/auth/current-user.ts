import { readSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      name:
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ??
        "User",
    };
  }

  return readSessionUser();
}
