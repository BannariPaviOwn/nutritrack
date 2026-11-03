"use client";

import { useActionState, useState } from "react";
import { upsertWeightAction, type WeightActionState } from "@/lib/data/weight";
import type { WeightUnit } from "@/lib/types";
import { UnitToggle } from "@/components/UnitToggle";
import { Alert, Button, Input, Label } from "@/components/ui";
import { normalizeWeightUnit } from "@/lib/units";

const initial: WeightActionState = {};

const WEIGHT_OPTIONS = [
  { value: "kg" as const, label: "Kg" },
  { value: "lb" as const, label: "Lb" },
];

export function WeightForm({
  defaultDate,
  weightUnit: initialUnit = "kg",
}: {
  defaultDate: string;
  weightUnit?: WeightUnit;
}) {
  const [state, formAction, pending] = useActionState(upsertWeightAction, initial);
  const [unit, setUnit] = useState<WeightUnit>(normalizeWeightUnit(initialUnit));

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="logged_on">Date</Label>
        <Input id="logged_on" name="logged_on" type="date" defaultValue={defaultDate} required />
      </div>

      <UnitToggle
        name="weight_unit"
        legend="Unit"
        value={unit}
        options={WEIGHT_OPTIONS}
        onChange={setUnit}
      />

      <div>
        <Label htmlFor="weight_value">Weight ({unit})</Label>
        <Input
          key={unit}
          id="weight_value"
          name="weight_value"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max={unit === "lb" ? 1100 : 500}
          required
          placeholder={unit === "lb" ? "160" : "72.5"}
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
