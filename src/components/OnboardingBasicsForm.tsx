"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/data/profiles";
import type { Profile } from "@/lib/types";
import { HeightFields } from "@/components/HeightFields";
import { Alert, Button } from "@/components/ui";

const initial: ProfileActionState = {};

/** Height + gender for first-time setup (name preserved via hidden field). */
export function OnboardingBasicsForm({
  profile,
  requireGender,
  requireHeight,
}: {
  profile: Profile;
  requireGender: boolean;
  requireHeight: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="name" value={profile.name} />
      <input type="hidden" name="next" value="/onboarding" />
      <input type="hidden" name="weight_unit" value={profile.weight_unit ?? "kg"} />
      {profile.starting_weight_kg != null ? (
        <input
          type="hidden"
          name="starting_weight_kg"
          value={profile.starting_weight_kg}
        />
      ) : null}
      {profile.target_weight_kg != null ? (
        <input
          type="hidden"
          name="target_weight_kg"
          value={profile.target_weight_kg}
        />
      ) : null}
      {profile.daily_calorie_goal != null ? (
        <input
          type="hidden"
          name="daily_calorie_goal"
          value={profile.daily_calorie_goal}
        />
      ) : null}

      {requireGender || !profile.gender ? (
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
      ) : (
        <input type="hidden" name="gender" value={profile.gender} />
      )}

      {requireHeight || profile.height_cm == null ? (
        <HeightFields
          heightCm={profile.height_cm}
          heightUnit={profile.height_unit ?? "cm"}
          required
        />
      ) : (
        <>
          <input type="hidden" name="height_cm" value={profile.height_cm} />
          <input type="hidden" name="height_unit" value={profile.height_unit ?? "cm"} />
        </>
      )}

      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save basics"}
      </Button>
    </form>
  );
}
