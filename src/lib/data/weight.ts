"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { todayISO } from "@/lib/dates";
import { readStore, updateStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { WeightLog, WeightUnit } from "@/lib/types";
import {
  DEFAULT_WEIGHT_UNIT,
  fromDisplayWeight,
  normalizeWeightUnit,
} from "@/lib/units";

const weightSchema = z.object({
  logged_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.number().positive().max(500),
  weight_unit: z.enum(["kg", "lb"]).default(DEFAULT_WEIGHT_UNIT),
});

export async function listWeightLogs(limit = 30): Promise<WeightLog[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as WeightLog[];
  }

  const store = await readStore();
  return store.weight_logs
    .filter((w) => w.user_id === user.id)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, limit);
}

export async function getWeightForDate(date: string): Promise<WeightLog | null> {
  const logs = await listWeightLogs(365);
  return logs.find((l) => l.logged_on === date) ?? null;
}

export async function listWeightInRange(start: string, end: string): Promise<WeightLog[]> {
  const logs = await listWeightLogs(400);
  return logs
    .filter((l) => l.logged_on >= start && l.logged_on <= end)
    .sort((a, b) => a.logged_on.localeCompare(b.logged_on));
}

export type WeightActionState = { error?: string; success?: string };

export async function upsertWeightAction(
  _prev: WeightActionState,
  formData: FormData,
): Promise<WeightActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const weightUnit: WeightUnit = normalizeWeightUnit(
    String(formData.get("weight_unit") ?? ""),
  );
  // Accept display value (preferred) or legacy weight_kg field name.
  const valueRaw = formData.get("weight_value") ?? formData.get("weight_kg");
  const valueNum = Number(valueRaw);
  if (!Number.isFinite(valueNum) || valueNum <= 0) {
    return { error: "Enter a valid weight" };
  }

  const weight_kg = fromDisplayWeight(valueNum, weightUnit);

  const parsed = weightSchema.safeParse({
    logged_on: String(formData.get("logged_on") ?? todayISO()),
    weight_kg,
    weight_unit: weightUnit,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid weight" };
  }

  const { logged_on } = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error: upsertError } = await supabase.from("weight_logs").upsert(
      {
        user_id: user.id,
        logged_on,
        weight_kg: parsed.data.weight_kg,
      },
      { onConflict: "user_id,logged_on" },
    );
    if (upsertError) return { error: upsertError.message };

    // Persist preference when user logs in a different unit.
    await supabase
      .from("profiles")
      .update({ weight_unit: weightUnit, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  } else {
    await updateStore((store) => {
      const existing = store.weight_logs.find(
        (w) => w.user_id === user.id && w.logged_on === logged_on,
      );
      if (existing) {
        existing.weight_kg = parsed.data.weight_kg;
      } else {
        store.weight_logs.push({
          id: randomUUID(),
          user_id: user.id,
          logged_on,
          weight_kg: parsed.data.weight_kg,
          created_at: new Date().toISOString(),
        });
      }
      const profile = store.profiles.find((p) => p.id === user.id);
      if (profile) {
        profile.weight_unit = weightUnit;
        profile.updated_at = new Date().toISOString();
      }
    });
  }

  revalidatePath("/weight");
  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath("/profile");
  return { success: "Weight saved" };
}

export async function deleteWeightAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.from("weight_logs").delete().eq("id", id).eq("user_id", user.id);
  } else {
    await updateStore((store) => {
      store.weight_logs = store.weight_logs.filter(
        (w) => !(w.id === id && w.user_id === user.id),
      );
    });
  }

  revalidatePath("/weight");
  revalidatePath("/today");
  revalidatePath("/history");
}
