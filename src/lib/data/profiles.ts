"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { updateStore, readStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).max(80),
  height_cm: z.coerce.number().positive().max(300).nullable().optional(),
  starting_weight_kg: z.coerce.number().positive().max(500).nullable().optional(),
  target_weight_kg: z.coerce.number().positive().max(500).nullable().optional(),
  daily_calorie_goal: z.coerce.number().int().positive().max(10000).nullable().optional(),
});

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Profile | null;
  }

  const store = await readStore();
  return store.profiles.find((p) => p.id === user.id) ?? null;
}

export type ProfileActionState = { error?: string; success?: string };

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const heightRaw = emptyToNull(formData.get("height_cm"));
  const startRaw = emptyToNull(formData.get("starting_weight_kg"));
  const targetRaw = emptyToNull(formData.get("target_weight_kg"));
  const calRaw = emptyToNull(formData.get("daily_calorie_goal"));

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    height_cm: heightRaw,
    starting_weight_kg: startRaw,
    target_weight_kg: targetRaw,
    daily_calorie_goal: calRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }

  const payload = {
    name: parsed.data.name,
    height_cm: parsed.data.height_cm ?? null,
    starting_weight_kg: parsed.data.starting_weight_kg ?? null,
    target_weight_kg: parsed.data.target_weight_kg ?? null,
    daily_calorie_goal: parsed.data.daily_calorie_goal ?? null,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id);
    if (error) return { error: error.message };
  } else {
    await updateStore((store) => {
      const profile = store.profiles.find((p) => p.id === user.id);
      if (!profile) throw new Error("Profile not found");
      Object.assign(profile, payload);
      const localUser = store.users.find((u) => u.id === user.id);
      if (localUser) localUser.name = payload.name;
    });
  }

  revalidatePath("/profile");
  revalidatePath("/today");
  return { success: "Profile saved" };
}
