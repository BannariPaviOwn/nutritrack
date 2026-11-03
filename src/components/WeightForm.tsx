"use client";

import { useActionState } from "react";
import { upsertWeightAction, type WeightActionState } from "@/lib/data/weight";
import { Alert, Button, Input, Label } from "@/components/ui";

const initial: WeightActionState = {};

export function WeightForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction, pending] = useActionState(upsertWeightAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="logged_on">Date</Label>
        <Input id="logged_on" name="logged_on" type="date" defaultValue={defaultDate} required />
      </div>
      <div>
        <Label htmlFor="weight_kg">Weight (kg)</Label>
        <Input
          id="weight_kg"
          name="weight_kg"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="500"
          required
          placeholder="72.5"
        />
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save weight"}
      </Button>
    </form>
  );
}
