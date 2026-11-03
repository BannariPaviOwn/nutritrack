"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  signupAction,
  type AuthState,
} from "@/lib/auth/actions";
import { Alert, Button, Input, Label } from "@/components/ui";

const initial: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" ? (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required placeholder="Alex" />
        </div>
      ) : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          placeholder="At least 6 characters"
        />
      </div>
      {mode === "signup" ? (
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-slate-700">
            Gender
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900">
              <input
                type="radio"
                name="gender"
                value="male"
                required
                className="accent-teal-700"
              />
              Male
            </label>
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900">
              <input
                type="radio"
                name="gender"
                value="female"
                required
                className="accent-teal-700"
              />
              Female
            </label>
          </div>
        </fieldset>
      ) : null}
      {state.error ? <Alert>{state.error}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
