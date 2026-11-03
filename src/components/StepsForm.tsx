"use client";

import { useActionState } from "react";
import { upsertStepsAction, type StepsActionState } from "@/lib/data/steps";
import { Alert, Button, Input, Label } from "@/components/ui";

const initial: StepsActionState = {};

export function StepsForm({
  defaultDate,
  defaultSteps,
}: {
  defaultDate: string;
  defaultSteps?: number | null;
}) {
  const [state, formAction, pending] = useActionState(upsertStepsAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="steps_logged_on">Date</Label>
        <Input
          id="steps_logged_on"
          name="logged_on"
          type="date"
          defaultValue={defaultDate}
          required
        />
      </div>
      <div>
        <Label htmlFor="steps">Steps</Label>
        <Input
          id="steps"
          name="steps"
          type="number"
          inputMode="numeric"
          min="0"
          max="200000"
          step="1"
          required
          placeholder="8000"
          defaultValue={defaultSteps ?? ""}
        />
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save steps"}
      </Button>
    </form>
  );
}
