"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { todayISO } from "@/lib/dates";
import { readStore, updateStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { WeightLog } from "@/lib/types";

const weightSchema = z.object({
  logged_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.coerce.number().positive().max(500),
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

export type WeightActionState = { error?: string; success?: string };

export async function upsertWeightAction(
  _prev: WeightActionState,
  formData: FormData,
): Promise<WeightActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const parsed = weightSchema.safeParse({
    logged_on: String(formData.get("logged_on") ?? todayISO()),
    weight_kg: formData.get("weight_kg"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid weight" };
  }

  const { logged_on, weight_kg } = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("weight_logs").upsert(
      {
        user_id: user.id,
        logged_on,
        weight_kg,
      },
      { onConflict: "user_id,logged_on" },
    );
    if (error) return { error: error.message };
  } else {
    await updateStore((store) => {
      const existing = store.weight_logs.find(
        (w) => w.user_id === user.id && w.logged_on === logged_on,
      );
      if (existing) {
        existing.weight_kg = weight_kg;
      } else {
        store.weight_logs.push({
          id: randomUUID(),
          user_id: user.id,
          logged_on,
          weight_kg,
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  revalidatePath("/weight");
  revalidatePath("/today");
  revalidatePath("/history");
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
