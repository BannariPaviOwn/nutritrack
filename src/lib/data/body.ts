"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatus } from "@/lib/data/onboarding";
import { todayISO } from "@/lib/dates";
import { readStore, StoreWriteError, updateStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { BodyLog } from "@/lib/types";

const bodySchema = z.object({
  logged_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  waist_in: z.coerce.number().positive().max(200),
  hip_in: z.coerce.number().positive().max(200),
  thigh_in: z.coerce.number().positive().max(200),
});

export async function listBodyLogs(limit = 60): Promise<BodyLog[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("body_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as BodyLog[];
  }

  const store = await readStore();
  return store.body_logs
    .filter((b) => b.user_id === user.id)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, limit);
}

export async function getBodyForDate(date: string): Promise<BodyLog | null> {
  const logs = await listBodyLogs(400);
  return logs.find((l) => l.logged_on === date) ?? null;
}

export async function listBodyInRange(start: string, end: string): Promise<BodyLog[]> {
  const logs = await listBodyLogs(400);
  return logs
    .filter((l) => l.logged_on >= start && l.logged_on <= end)
    .sort((a, b) => a.logged_on.localeCompare(b.logged_on));
}

export type BodyActionState = { error?: string; success?: string };

export async function upsertBodyAction(
  _prev: BodyActionState,
  formData: FormData,
): Promise<BodyActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const parsed = bodySchema.safeParse({
    logged_on: String(formData.get("logged_on") ?? todayISO()),
    waist_in: formData.get("waist_in"),
    hip_in: formData.get("hip_in"),
    thigh_in: formData.get("thigh_in"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid measurements" };
  }

  const { logged_on, waist_in, hip_in, thigh_in } = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("body_logs").upsert(
      {
        user_id: user.id,
        logged_on,
        waist_in,
        hip_in,
        thigh_in,
      },
      { onConflict: "user_id,logged_on" },
    );
    if (error) return { error: error.message };
  } else {
    try {
      await updateStore((store) => {
        const existing = store.body_logs.find(
          (b) => b.user_id === user.id && b.logged_on === logged_on,
        );
        if (existing) {
          existing.waist_in = waist_in;
          existing.hip_in = hip_in;
          existing.thigh_in = thigh_in;
        } else {
          store.body_logs.push({
            id: randomUUID(),
            user_id: user.id,
            logged_on,
            waist_in,
            hip_in,
            thigh_in,
            created_at: new Date().toISOString(),
          });
        }
      });
    } catch (error) {
      if (error instanceof StoreWriteError) return { error: error.message };
      throw error;
    }
  }

  revalidatePath("/measures");
  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath("/onboarding");

  const next = String(formData.get("next") ?? "").trim();
  if (next) {
    const status = await getOnboardingStatus();
    if (status.complete) redirect("/today");
    redirect(next);
  }

  return { success: "Measurements saved" };
}

export async function deleteBodyAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.from("body_logs").delete().eq("id", id).eq("user_id", user.id);
  } else {
    await updateStore((store) => {
      store.body_logs = store.body_logs.filter(
        (b) => !(b.id === id && b.user_id === user.id),
      );
    });
  }

  revalidatePath("/measures");
  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath("/onboarding");
}
