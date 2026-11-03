import type { HeightUnit, WeightUnit } from "@/lib/types";

export type { HeightUnit, WeightUnit };

/** Defaults: metric. User can switch to ft / lb in profile. */
export const DEFAULT_HEIGHT_UNIT: HeightUnit = "cm";
export const DEFAULT_WEIGHT_UNIT: WeightUnit = "kg";

const CM_PER_INCH = 2.54;
const LB_PER_KG = 2.2046226218;

export function normalizeHeightUnit(value: unknown): HeightUnit {
  return value === "ft" ? "ft" : "cm";
}

export function normalizeWeightUnit(value: unknown): WeightUnit {
  return value === "lb" ? "lb" : "kg";
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Convert feet + inches to centimeters. */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return round1(totalInches * CM_PER_INCH);
}

/** Split centimeters into whole feet + inches (inches may be fractional). */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = round1(totalInches - feet * 12);
  return { feet, inches };
}

export function lbToKg(lb: number): number {
  return round1(lb / LB_PER_KG);
}

export function kgToLb(kg: number): number {
  return round1(kg * LB_PER_KG);
}

export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? kgToLb(kg) : round1(kg);
}

export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === "lb" ? lbToKg(value) : round1(value);
}

export function formatWeight(
  kg: number | null | undefined,
  unit: WeightUnit = DEFAULT_WEIGHT_UNIT,
): string {
  if (kg == null) return "—";
  return `${toDisplayWeight(kg, unit)} ${unit}`;
}

export function formatHeight(
  heightCm: number | null | undefined,
  unit: HeightUnit = DEFAULT_HEIGHT_UNIT,
): string {
  if (heightCm == null) return "—";
  if (unit === "ft") {
    const { feet, inches } = cmToFtIn(heightCm);
    return `${feet}' ${inches}"`;
  }
  return `${round1(heightCm)} cm`;
}
