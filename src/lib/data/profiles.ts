"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatus } from "@/lib/data/onboarding";
import { updateStore, readStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { Gender, HeightUnit, Profile, WeightUnit } from "@/lib/types";
import {
  DEFAULT_HEIGHT_UNIT,
  DEFAULT_WEIGHT_UNIT,
  fromDisplayWeight,
  ftInToCm,
  normalizeHeightUnit,
  normalizeWeightUnit,
} from "@/lib/units";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const genderSchema = z.enum(["male", "female"]);
const heightUnitSchema = z.enum(["cm", "ft"]);
const weightUnitSchema = z.enum(["kg", "lb"]);

const profileSchema = z.object({
  name: z.string().min(1).max(80),
  gender: genderSchema,
  height_unit: heightUnitSchema.default(DEFAULT_HEIGHT_UNIT),
  weight_unit: weightUnitSchema.default(DEFAULT_WEIGHT_UNIT),
  /** Canonical cm after conversion; optional on profile edit. */
  height_cm: z.number().positive().max(300).nullable().optional(),
  starting_weight_kg: z.number().positive().max(500).nullable().optional(),
  target_weight_kg: z.number().positive().max(500).nullable().optional(),
  daily_calorie_goal: z.coerce.number().int().positive().max(10000).nullable().optional(),
});

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function parseOptionalPositive(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function normalizeGender(value: unknown): Gender | null {
  if (value === "male" || value === "female") return value;
  return null;
}

function withUnitDefaults(profile: Profile): Profile {
  return {
    ...profile,
    height_unit: normalizeHeightUnit(profile.height_unit),
    weight_unit: normalizeWeightUnit(profile.weight_unit),
    gender: normalizeGender(profile.gender),
  };
}

/** Resolve height_cm from cm field or feet+inches, based on height_unit. */
function resolveHeightCm(
  heightUnit: HeightUnit,
  formData: FormData,
): { height_cm: number | null; error?: string } {
  if (heightUnit === "ft") {
    const feetRaw = emptyToNull(formData.get("height_ft"));
    const inchesRaw = emptyToNull(formData.get("height_in"));
    // Hidden preserve path: form may send height_cm when height UI is skipped
    if (feetRaw == null && inchesRaw == null) {
      const preserved = parseOptionalPositive(emptyToNull(formData.get("height_cm")));
      return { height_cm: preserved };
    }
    const feet = Number(feetRaw ?? 0);
    const inches = Number(inchesRaw ?? 0);
    if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) {
      return { height_cm: null, error: "Enter a valid height in feet and inches" };
    }
    if (feet === 0 && inches === 0) {
      return { height_cm: null };
    }
    if (inches >= 12) {
      return { height_cm: null, error: "Inches must be less than 12" };
    }
    const cm = ftInToCm(feet, inches);
    if (cm <= 0 || cm > 300) {
      return { height_cm: null, error: "Height out of range" };
    }
    return { height_cm: cm };
  }

  const cm = parseOptionalPositive(emptyToNull(formData.get("height_cm")));
  if (cm != null && cm > 300) {
    return { height_cm: null, error: "Height out of range" };
  }
  return { height_cm: cm };
}

function resolveWeightKg(
  weightUnit: WeightUnit,
  formData: FormData,
  field: "starting_weight" | "target_weight",
): number | null {
  // Prefer display-unit field; fall back to legacy *_kg hidden/canonical.
  const displayRaw = emptyToNull(formData.get(`${field}_value`));
  if (displayRaw != null) {
    const n = Number(displayRaw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return fromDisplayWeight(n, weightUnit);
  }
  return parseOptionalPositive(emptyToNull(formData.get(`${field}_kg`)));
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
    if (!data) return null;
    return withUnitDefaults(data as Profile);
  }

  const store = await readStore();
  const profile = store.profiles.find((p) => p.id === user.id) ?? null;
  if (!profile) return null;
  return withUnitDefaults(profile);
}

export type ProfileActionState = { error?: string; success?: string };

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const heightUnit = normalizeHeightUnit(String(formData.get("height_unit") ?? ""));
  const weightUnit = normalizeWeightUnit(String(formData.get("weight_unit") ?? ""));

  const heightResolved = resolveHeightCm(heightUnit, formData);
  if (heightResolved.error) return { error: heightResolved.error };

  const startingKg = resolveWeightKg(weightUnit, formData, "starting_weight");
  const targetKg = resolveWeightKg(weightUnit, formData, "target_weight");
  const calRaw = emptyToNull(formData.get("daily_calorie_goal"));

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    gender: String(formData.get("gender") ?? "").trim(),
    height_unit: heightUnit,
    weight_unit: weightUnit,
    height_cm: heightResolved.height_cm,
    starting_weight_kg: startingKg,
    target_weight_kg: targetKg,
    daily_calorie_goal: calRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }

  const payload = {
    name: parsed.data.name,
    gender: parsed.data.gender,
    height_cm: parsed.data.height_cm ?? null,
    height_unit: parsed.data.height_unit,
    starting_weight_kg: parsed.data.starting_weight_kg ?? null,
    target_weight_kg: parsed.data.target_weight_kg ?? null,
    weight_unit: parsed.data.weight_unit,
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
  revalidatePath("/onboarding");
  revalidatePath("/weight");
  revalidatePath("/history");

  const next = String(formData.get("next") ?? "").trim();
  if (next) {
    const status = await getOnboardingStatus();
    if (status.complete) redirect("/today");
    redirect(next);
  }

  return { success: "Profile saved" };
}
