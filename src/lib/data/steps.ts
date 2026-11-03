"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { todayISO } from "@/lib/dates";
import { readStore, updateStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { StepLog } from "@/lib/types";

const stepsSchema = z.object({
  logged_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.coerce.number().int().min(0).max(200_000),
});

export async function listStepLogs(limit = 60): Promise<StepLog[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("step_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as StepLog[];
  }

  const store = await readStore();
  return store.step_logs
    .filter((s) => s.user_id === user.id)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, limit);
}

export async function getStepsForDate(date: string): Promise<StepLog | null> {
  const logs = await listStepLogs(400);
  return logs.find((l) => l.logged_on === date) ?? null;
}

export async function listStepsInRange(start: string, end: string): Promise<StepLog[]> {
  const logs = await listStepLogs(400);
  return logs
    .filter((l) => l.logged_on >= start && l.logged_on <= end)
    .sort((a, b) => a.logged_on.localeCompare(b.logged_on));
}

export type StepsActionState = { error?: string; success?: string };

export async function upsertStepsAction(
  _prev: StepsActionState,
  formData: FormData,
): Promise<StepsActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const parsed = stepsSchema.safeParse({
    logged_on: String(formData.get("logged_on") ?? todayISO()),
    steps: formData.get("steps"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid steps" };
  }

  const { logged_on, steps } = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("step_logs").upsert(
      {
        user_id: user.id,
        logged_on,
        steps,
      },
      { onConflict: "user_id,logged_on" },
    );
    if (error) return { error: error.message };
  } else {
    await updateStore((store) => {
      const existing = store.step_logs.find(
        (s) => s.user_id === user.id && s.logged_on === logged_on,
      );
      if (existing) {
        existing.steps = steps;
      } else {
        store.step_logs.push({
          id: randomUUID(),
          user_id: user.id,
          logged_on,
          steps,
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  revalidatePath("/measures");
  revalidatePath("/today");
  revalidatePath("/history");
  return { success: "Steps saved" };
}

export async function deleteStepsAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.from("step_logs").delete().eq("id", id).eq("user_id", user.id);
  } else {
    await updateStore((store) => {
      store.step_logs = store.step_logs.filter(
        (s) => !(s.id === id && s.user_id === user.id),
      );
    });
  }

  revalidatePath("/measures");
  revalidatePath("/today");
  revalidatePath("/history");
}
