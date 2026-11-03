"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui";
import { UnitToggle } from "@/components/UnitToggle";
import type { HeightUnit } from "@/lib/types";
import { cmToFtIn, normalizeHeightUnit } from "@/lib/units";

const HEIGHT_OPTIONS = [
  { value: "cm" as const, label: "Cm" },
  { value: "ft" as const, label: "Ft / in" },
];

export function HeightFields({
  heightCm,
  heightUnit,
  required = false,
}: {
  heightCm: number | null;
  heightUnit: HeightUnit;
  required?: boolean;
}) {
  const [unit, setUnit] = useState<HeightUnit>(normalizeHeightUnit(heightUnit));
  const ftIn = heightCm != null ? cmToFtIn(heightCm) : { feet: 0, inches: 0 };

  return (
    <div className="space-y-3">
      <UnitToggle
        name="height_unit"
        legend="Height unit"
        value={unit}
        options={HEIGHT_OPTIONS}
        onChange={setUnit}
      />

      {unit === "cm" ? (
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
            required={required}
            defaultValue={heightCm ?? ""}
            placeholder="170"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="height_ft">Feet</Label>
            <Input
              id="height_ft"
              name="height_ft"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              max="8"
              required={required}
              defaultValue={heightCm != null ? ftIn.feet : ""}
              placeholder="5"
            />
          </div>
          <div>
            <Label htmlFor="height_in">Inches</Label>
            <Input
              id="height_in"
              name="height_in"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="11.9"
              required={required}
              defaultValue={heightCm != null ? ftIn.inches : ""}
              placeholder="7"
            />
          </div>
        </div>
      )}
    </div>
  );
}
