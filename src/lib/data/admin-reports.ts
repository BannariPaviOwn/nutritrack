"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { readStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import type {
  BodyLog,
  FoodLog,
  Gender,
  Profile,
  StepLog,
  WeightLog,
} from "@/lib/types";

export type PatientSummary = {
  id: string;
  name: string;
  email: string;
  gender: Gender | null;
  height_cm: number | null;
  height_unit: Profile["height_unit"];
  weight_unit: Profile["weight_unit"];
  created_at: string;
  latest_weight_kg: number | null;
  latest_weight_on: string | null;
  latest_waist_in: number | null;
  latest_hip_in: number | null;
  latest_thigh_in: number | null;
  latest_body_on: string | null;
  latest_steps: number | null;
  latest_steps_on: string | null;
  last_activity_on: string | null;
};

export type PatientDetail = {
  profile: Profile;
  weights: WeightLog[];
  bodies: BodyLog[];
  steps: StepLog[];
  foods: FoodLog[];
  foodCalorieTotal: number;
  foodDaysWithCalories: number;
};

export type AdminReportsAvailability = {
  mode: "local" | "supabase";
  supported: boolean;
  message?: string;
};

function normalizeGender(value: unknown): Gender | null {
  if (value === "male" || value === "female") return value;
  return null;
}

function latestByDate<T extends { logged_on: string }>(
  items: T[],
): T | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) => b.logged_on.localeCompare(a.logged_on))[0] ?? null;
}

function maxDate(dates: Array<string | null | undefined>): string | null {
  const valid = dates.filter((d): d is string => Boolean(d));
  if (valid.length === 0) return null;
  return valid.sort((a, b) => b.localeCompare(a))[0] ?? null;
}

export async function getAdminReportsAvailability(): Promise<AdminReportsAvailability> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    return {
      mode: "supabase",
      supported: false,
      message:
        "Admin patient reports are fully supported in local JSON mode. Supabase mode needs a service-role server client (not wired in this MVP) because RLS only returns the signed-in user's rows.",
    };
  }
  return { mode: "local", supported: true };
}

export async function listPatientSummaries(): Promise<PatientSummary[]> {
  await requireAdmin();
  if (isSupabaseConfigured()) return [];

  const store = await readStore();

  return store.profiles
    .map((raw) => {
      const profile: Profile = {
        ...raw,
        gender: normalizeGender(raw.gender),
      };
      const weights = store.weight_logs.filter((w) => w.user_id === profile.id);
      const bodies = store.body_logs.filter((b) => b.user_id === profile.id);
      const steps = store.step_logs.filter((s) => s.user_id === profile.id);
      const foods = store.food_logs.filter((f) => f.user_id === profile.id);

      const latestWeight = latestByDate(weights);
      const latestBody = latestByDate(bodies);
      const latestSteps = latestByDate(steps);
      const latestFood = latestByDate(foods);

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        gender: profile.gender,
        height_cm: profile.height_cm,
        height_unit: profile.height_unit,
        weight_unit: profile.weight_unit,
        created_at: profile.created_at,
        latest_weight_kg: latestWeight?.weight_kg ?? null,
        latest_weight_on: latestWeight?.logged_on ?? null,
        latest_waist_in: latestBody?.waist_in ?? null,
        latest_hip_in: latestBody?.hip_in ?? null,
        latest_thigh_in: latestBody?.thigh_in ?? null,
        latest_body_on: latestBody?.logged_on ?? null,
        latest_steps: latestSteps?.steps ?? null,
        latest_steps_on: latestSteps?.logged_on ?? null,
        last_activity_on: maxDate([
          latestWeight?.logged_on,
          latestBody?.logged_on,
          latestSteps?.logged_on,
          latestFood?.logged_on,
          profile.updated_at,
        ]),
      } satisfies PatientSummary;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPatientDetail(
  userId: string,
): Promise<PatientDetail | null> {
  await requireAdmin();
  if (isSupabaseConfigured()) return null;

  const store = await readStore();
  const raw = store.profiles.find((p) => p.id === userId);
  if (!raw) return null;

  const profile: Profile = {
    ...raw,
    gender: normalizeGender(raw.gender),
  };

  const weights = store.weight_logs
    .filter((w) => w.user_id === userId)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, 30);

  const bodies = store.body_logs
    .filter((b) => b.user_id === userId)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, 30);

  const steps = store.step_logs
    .filter((s) => s.user_id === userId)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, 30);

  const foods = store.food_logs
    .filter((f) => f.user_id === userId)
    .sort((a, b) => {
      const byDate = b.logged_on.localeCompare(a.logged_on);
      if (byDate !== 0) return byDate;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 40);

  const foodsWithCals = foods.filter((f) => f.calories != null);
  const foodCalorieTotal = foodsWithCals.reduce(
    (sum, f) => sum + (f.calories ?? 0),
    0,
  );
  const foodDaysWithCalories = new Set(foodsWithCals.map((f) => f.logged_on))
    .size;

  return {
    profile,
    weights,
    bodies,
    steps,
    foods,
    foodCalorieTotal,
    foodDaysWithCalories,
  };
}
