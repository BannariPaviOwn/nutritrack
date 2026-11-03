import { promises as fs } from "fs";
import path from "path";
import type { FoodLog, Gender, LocalStore, MealType, Profile } from "@/lib/types";
import { isVercelRuntime } from "@/lib/mode";
import { normalizeHeightUnit, normalizeWeightUnit } from "@/lib/units";

const mealTypes = new Set<MealType>(["breakfast", "lunch", "dinner", "snack"]);

const PROJECT_STORE_PATH = path.join(process.cwd(), "data", "store.json");
const TEMPLATE_PATH = path.join(
  process.cwd(),
  "data",
  "templates",
  "demo-store.json",
);
const VERCEL_STORE_PATH = path.join("/tmp", "nutritrack-store.json");

export class StoreWriteError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StoreWriteError";
  }
}

function activeStorePath(): string {
  return isVercelRuntime() ? VERCEL_STORE_PATH : PROJECT_STORE_PATH;
}

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

function normalizeStore(parsed: Partial<LocalStore>): LocalStore {
  return {
    users: parsed.users ?? [],
    profiles: (parsed.profiles ?? []).map((p) => normalizeProfile(p)),
    weight_logs: parsed.weight_logs ?? [],
    food_logs: (parsed.food_logs ?? []).map((f) => normalizeFoodLog(f)),
    body_logs: parsed.body_logs ?? [],
    step_logs: parsed.step_logs ?? [],
  };
}

async function readJsonFile(filePath: string): Promise<LocalStore | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeStore(JSON.parse(raw) as Partial<LocalStore>);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw error;
  }
}

async function loadTemplateStore(): Promise<LocalStore> {
  const fromTemplate = await readJsonFile(TEMPLATE_PATH);
  if (fromTemplate) return fromTemplate;
  return emptyStore();
}

/**
 * Resolve the store for reads:
 * 1) Active writable path (/tmp on Vercel, data/store.json locally)
 * 2) Bundled project data/store.json (if present in deploy)
 * 3) Bundled demo template (read-only fallback — never crash)
 */
async function resolveStoreForRead(): Promise<{
  store: LocalStore;
  writablePath: string;
}> {
  const writablePath = activeStorePath();
  const active = await readJsonFile(writablePath);
  if (active) return { store: active, writablePath };

  // On Vercel, also try the bundled project path (usually absent / gitignored).
  if (isVercelRuntime()) {
    const bundled = await readJsonFile(PROJECT_STORE_PATH);
    if (bundled) {
      // Best-effort seed into /tmp so subsequent writes have a base.
      try {
        await writeStoreToPath(writablePath, bundled);
      } catch {
        // Read still works from memory / bundled copy.
      }
      return { store: bundled, writablePath };
    }
  }

  const seeded = await loadTemplateStore();
  try {
    await writeStoreToPath(writablePath, seeded);
  } catch {
    // Template remains available in-memory for demo reads.
  }
  return { store: seeded, writablePath };
}

async function writeStoreToPath(
  filePath: string,
  store: LocalStore,
): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    throw new StoreWriteError(
      isVercelRuntime()
        ? "Could not save data on this server (ephemeral storage). Try again, or run locally for persistent JSON."
        : "Could not write local data store. Check that the data/ folder is writable.",
      { cause: error },
    );
  }
}

export async function readStore(): Promise<LocalStore> {
  const { store } = await resolveStoreForRead();
  return store;
}

export async function writeStore(store: LocalStore): Promise<void> {
  await writeStoreToPath(activeStorePath(), store);
}

export async function updateStore(
  mutator: (store: LocalStore) => void | Promise<void>,
): Promise<LocalStore> {
  const { store, writablePath } = await resolveStoreForRead();
  await mutator(store);
  await writeStoreToPath(writablePath, store);
  return store;
}
