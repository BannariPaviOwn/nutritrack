import { promises as fs } from "fs";
import path from "path";
import type { LocalStore } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

const emptyStore = (): LocalStore => ({
  users: [],
  profiles: [],
  weight_logs: [],
  food_logs: [],
});

export async function readStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      users: parsed.users ?? [],
      profiles: parsed.profiles ?? [],
      weight_logs: parsed.weight_logs ?? [],
      food_logs: parsed.food_logs ?? [],
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
