"use client";

import { useActionState, useState } from "react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/data/profiles";
import type { Profile, WeightUnit } from "@/lib/types";
import { HeightFields } from "@/components/HeightFields";
import { UnitToggle } from "@/components/UnitToggle";
import { Alert, Button, Input, Label } from "@/components/ui";
import { normalizeWeightUnit, toDisplayWeight } from "@/lib/units";

const initial: ProfileActionState = {};

const WEIGHT_OPTIONS = [
  { value: "kg" as const, label: "Kg" },
  { value: "lb" as const, label: "Lb" },
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    normalizeWeightUnit(profile.weight_unit),
  );

  const startDisplay =
    profile.starting_weight_kg != null
      ? toDisplayWeight(profile.starting_weight_kg, weightUnit)
      : "";
  const targetDisplay =
    profile.target_weight_kg != null
      ? toDisplayWeight(profile.target_weight_kg, weightUnit)
      : "";

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
              defaultChecked={profile.gender === "male"}
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
              defaultChecked={profile.gender === "female"}
              className="accent-teal-700"
            />
            Female
          </label>
        </div>
      </fieldset>

      <HeightFields
        heightCm={profile.height_cm}
        heightUnit={profile.height_unit}
      />

      <UnitToggle
        name="weight_unit"
        legend="Weight unit"
        value={weightUnit}
        options={WEIGHT_OPTIONS}
        onChange={setWeightUnit}
      />

      <div>
        <Label htmlFor="starting_weight_value">
          Starting weight ({weightUnit}, optional)
        </Label>
        <Input
          key={`start-${weightUnit}`}
          id="starting_weight_value"
          name="starting_weight_value"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max={weightUnit === "lb" ? 1100 : 500}
          defaultValue={startDisplay}
        />
      </div>
      <div>
        <Label htmlFor="target_weight_value">
          Target weight ({weightUnit}, optional)
        </Label>
        <Input
          key={`target-${weightUnit}`}
          id="target_weight_value"
          name="target_weight_value"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max={weightUnit === "lb" ? 1100 : 500}
          defaultValue={targetDisplay}
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
