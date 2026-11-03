"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { todayISO } from "@/lib/dates";
import { readStore, StoreWriteError, updateStore } from "@/lib/local/db";
import { deleteLocalMealPhoto, saveMealPhoto } from "@/lib/meal-photos";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { FoodLog, MealType } from "@/lib/types";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

const foodSchema = z.object({
  logged_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: z.enum(mealTypes),
  food_name: z.string().min(1).max(120),
  calories: z.coerce.number().int().nonnegative().max(10000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function normalizeFoodLog(row: FoodLog): FoodLog {
  return {
    ...row,
    photo_url: row.photo_url ?? null,
  };
}

export async function listFoodLogs(limit = 40): Promise<FoodLog[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return ((data ?? []) as FoodLog[]).map(normalizeFoodLog);
  }

  const store = await readStore();
  return store.food_logs
    .filter((f) => f.user_id === user.id)
    .map(normalizeFoodLog)
    .sort((a, b) => {
      const byDate = b.logged_on.localeCompare(a.logged_on);
      if (byDate !== 0) return byDate;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, limit);
}

export async function listFoodForDate(date: string): Promise<FoodLog[]> {
  const logs = await listFoodLogs(200);
  return logs.filter((l) => l.logged_on === date);
}

export async function listFoodInRange(start: string, end: string): Promise<FoodLog[]> {
  const logs = await listFoodLogs(400);
  return logs
    .filter((l) => l.logged_on >= start && l.logged_on <= end)
    .sort((a, b) => {
      const byDate = a.logged_on.localeCompare(b.logged_on);
      if (byDate !== 0) return byDate;
      return a.created_at.localeCompare(b.created_at);
    });
}

export type FoodActionState = { error?: string; success?: string };

export async function addFoodAction(
  _prev: FoodActionState,
  formData: FormData,
): Promise<FoodActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const calRaw = emptyToNull(formData.get("calories"));
  const notesRaw = emptyToNull(formData.get("notes"));

  const parsed = foodSchema.safeParse({
    logged_on: String(formData.get("logged_on") ?? todayISO()),
    meal_type: String(formData.get("meal_type") ?? "snack"),
    food_name: String(formData.get("food_name") ?? "").trim(),
    calories: calRaw,
    notes: notesRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid meal" };
  }

  const photoEntry = formData.get("photo");
  const photoFile =
    photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  const photoResult = await saveMealPhoto(user.id, photoFile);
  if (!photoResult.ok) {
    return { error: photoResult.error };
  }

  const row = {
    user_id: user.id,
    logged_on: parsed.data.logged_on,
    meal_type: parsed.data.meal_type as MealType,
    food_name: parsed.data.food_name,
    calories: parsed.data.calories ?? null,
    notes: parsed.data.notes ?? null,
    photo_url: photoResult.photo_url,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("food_logs").insert(row);
    if (error) return { error: error.message };
  } else {
    try {
      await updateStore((store) => {
        store.food_logs.push({
          id: randomUUID(),
          ...row,
          created_at: new Date().toISOString(),
        });
      });
    } catch (error) {
      if (error instanceof StoreWriteError) return { error: error.message };
      throw error;
    }
  }

  revalidatePath("/food");
  revalidatePath("/today");
  revalidatePath("/history");
  return { success: "Meal logged" };
}

export async function deleteFoodAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.from("food_logs").delete().eq("id", id).eq("user_id", user.id);
  } else {
    let photoUrl: string | null = null;
    await updateStore((store) => {
      const existing = store.food_logs.find(
        (f) => f.id === id && f.user_id === user.id,
      );
      photoUrl = existing?.photo_url ?? null;
      store.food_logs = store.food_logs.filter(
        (f) => !(f.id === id && f.user_id === user.id),
      );
    });
    await deleteLocalMealPhoto(photoUrl);
  }

  revalidatePath("/food");
  revalidatePath("/today");
  revalidatePath("/history");
}
