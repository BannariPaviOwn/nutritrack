"use client";

import { deleteBodyAction } from "@/lib/data/body";
import { deleteFoodAction } from "@/lib/data/food";
import { deleteStepsAction } from "@/lib/data/steps";
import { deleteWeightAction } from "@/lib/data/weight";
import { Button } from "@/components/ui";

export function DeleteFoodButton({ id }: { id: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 px-3 text-sm text-rose-700"
      onClick={() => {
        void deleteFoodAction(id);
      }}
    >
      Delete
    </Button>
  );
}

export function DeleteWeightButton({ id }: { id: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 px-3 text-sm text-rose-700"
      onClick={() => {
        void deleteWeightAction(id);
      }}
    >
      Delete
    </Button>
  );
}

export function DeleteBodyButton({ id }: { id: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 px-3 text-sm text-rose-700"
      onClick={() => {
        void deleteBodyAction(id);
      }}
    >
      Delete
    </Button>
  );
}

export function DeleteStepsButton({ id }: { id: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 px-3 text-sm text-rose-700"
      onClick={() => {
        void deleteStepsAction(id);
      }}
    >
      Delete
    </Button>
  );
}
