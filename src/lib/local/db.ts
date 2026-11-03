import { promises as fs } from "fs";
import path from "path";
import type { FoodLog, Gender, LocalStore, MealType, Profile } from "@/lib/types";
import { normalizeHeightUnit, normalizeWeightUnit } from "@/lib/units";

const mealTypes = new Set<MealType>(["breakfast", "lunch", "dinner", "snack"]);

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

const emptyStore = (): LocalStore => ({
  users: [],
  profiles: [],
  weight_logs: [],
  food_logs: [],
  body_logs: [],
  step_logs: [],
});

function normalizeFoodLog(raw: Partial<FoodLog> & { id: string }): FoodLog {
  const mealType = raw.meal_type;
  return {
    id: raw.id,
    user_id: raw.user_id ?? "",
    logged_on: raw.logged_on ?? "",
    meal_type: mealType && mealTypes.has(mealType) ? mealType : "snack",
    food_name: raw.food_name ?? "",
    calories: raw.calories ?? null,
    notes: raw.notes ?? null,
    photo_url: raw.photo_url ?? null,
    created_at: raw.created_at ?? new Date().toISOString(),
  };
}

function normalizeGender(value: unknown): Gender | null {
  if (value === "male" || value === "female") return value;
  return null;
}

function normalizeProfile(raw: Partial<Profile> & { id: string }): Profile {
  return {
    id: raw.id,
    email: raw.email ?? "",
    name: raw.name ?? "",
    gender: normalizeGender(raw.gender),
    height_cm: raw.height_cm ?? null,
    height_unit: normalizeHeightUnit(raw.height_unit),
    starting_weight_kg: raw.starting_weight_kg ?? null,
    target_weight_kg: raw.target_weight_kg ?? null,
    weight_unit: normalizeWeightUnit(raw.weight_unit),
    daily_calorie_goal: raw.daily_calorie_goal ?? null,
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? new Date().toISOString(),
  };
}

export async function readStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      users: parsed.users ?? [],
      profiles: (parsed.profiles ?? []).map((p) => normalizeProfile(p)),
      weight_logs: parsed.weight_logs ?? [],
      food_logs: (parsed.food_logs ?? []).map((f) => normalizeFoodLog(f)),
      body_logs: parsed.body_logs ?? [],
      step_logs: parsed.step_logs ?? [],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      const store = emptyStore();
      await writeStore(store);
      return store;
    }
    throw error;
  }
}

export async function writeStore(store: LocalStore): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function updateStore(
  mutator: (store: LocalStore) => void | Promise<void>,
): Promise<LocalStore> {
  const store = await readStore();
  await mutator(store);
  await writeStore(store);
  return store;
}
