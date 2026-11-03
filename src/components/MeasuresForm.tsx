"use client";

import { useActionState } from "react";
import { upsertBodyAction, type BodyActionState } from "@/lib/data/body";
import { Alert, Button, Input, Label } from "@/components/ui";

const initial: BodyActionState = {};

export function MeasuresForm({
  defaultDate,
  defaults,
  next,
}: {
  defaultDate: string;
  defaults?: {
    waist_in?: number | null;
    hip_in?: number | null;
    thigh_in?: number | null;
  };
  /** After save, redirect here (or to /today when onboarding is complete). */
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(upsertBodyAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <Label htmlFor="logged_on">Date</Label>
        <Input id="logged_on" name="logged_on" type="date" defaultValue={defaultDate} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="waist_in">Waist (in)</Label>
          <Input
            id="waist_in"
            name="waist_in"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="200"
            required
            placeholder="50"
            defaultValue={defaults?.waist_in ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="hip_in">Hip (in)</Label>
          <Input
            id="hip_in"
            name="hip_in"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="200"
            required
            placeholder="54"
            defaultValue={defaults?.hip_in ?? ""}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="thigh_in">Thigh (in)</Label>
        <Input
          id="thigh_in"
          name="thigh_in"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="200"
          required
          placeholder="24"
          defaultValue={defaults?.thigh_in ?? ""}
        />
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save measurements"}
      </Button>
    </form>
  );
}
