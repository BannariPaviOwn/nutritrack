"use client";

import { deleteFoodAction } from "@/lib/data/food";
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
