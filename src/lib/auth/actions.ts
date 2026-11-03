"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { updateStore } from "@/lib/local/db";
import { isSupabaseConfigured } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1).max(80).optional(),
});

export type AuthState = {
  error?: string;
  success?: string;
};

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, name } = parsed.data;
  const displayName = name ?? email.split("@")[0];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: displayName } },
    });
    if (error) return { error: error.message };
    redirect("/today");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const id = randomUUID();

  try {
    await updateStore((store) => {
      if (store.users.some((u) => u.email === email)) {
        throw new Error("An account with this email already exists");
      }
      store.users.push({
        id,
        email,
        name: displayName,
        password_hash: passwordHash,
        created_at: now,
      });
      store.profiles.push({
        id,
        email,
        name: displayName,
        height_cm: null,
        starting_weight_kg: null,
        target_weight_kg: null,
        daily_calorie_goal: null,
        created_at: now,
        updated_at: now,
      });
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create account",
    };
  }

  const token = await createSessionToken({
    id,
    email,
    name: displayName,
  });
  await setSessionCookie(token);
  redirect("/today");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    redirect("/today");
  }

  const { readStore } = await import("@/lib/local/db");
  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user) return { error: "Invalid email or password" };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { error: "Invalid email or password" };

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });
  await setSessionCookie(token);
  redirect("/today");
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearSessionCookie();
  redirect("/login");
}
