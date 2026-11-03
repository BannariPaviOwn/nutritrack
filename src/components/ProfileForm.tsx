"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/data/profiles";
import type { Profile } from "@/lib/types";
import { Alert, Button, Input, Label } from "@/components/ui";

const initial: ProfileActionState = {};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={profile.name} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email} disabled readOnly />
      </div>
      <div>
        <Label htmlFor="height_cm">Height (cm)</Label>
        <Input
          id="height_cm"
          name="height_cm"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="300"
          defaultValue={profile.height_cm ?? ""}
          placeholder="170"
        />
      </div>
      <div>
        <Label htmlFor="starting_weight_kg">Starting weight (kg, optional)</Label>
        <Input
          id="starting_weight_kg"
          name="starting_weight_kg"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="500"
          defaultValue={profile.starting_weight_kg ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="target_weight_kg">Target weight (kg, optional)</Label>
        <Input
          id="target_weight_kg"
          name="target_weight_kg"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="500"
          defaultValue={profile.target_weight_kg ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="daily_calorie_goal">Daily calorie goal (optional)</Label>
        <Input
          id="daily_calorie_goal"
          name="daily_calorie_goal"
          type="number"
          inputMode="numeric"
          min="1"
          max="10000"
          defaultValue={profile.daily_calorie_goal ?? ""}
          placeholder="2000"
        />
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
