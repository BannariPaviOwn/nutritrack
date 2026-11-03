"use client";

import { useActionState } from "react";
import { addFoodAction, type FoodActionState } from "@/lib/data/food";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";

const initial: FoodActionState = {};

export function FoodForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction, pending] = useActionState(addFoodAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="logged_on">Date</Label>
        <Input id="logged_on" name="logged_on" type="date" defaultValue={defaultDate} required />
      </div>
      <div>
        <Label htmlFor="meal_type">Meal</Label>
        <Select id="meal_type" name="meal_type" defaultValue="breakfast" required>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="food_name">Food</Label>
        <Input
          id="food_name"
          name="food_name"
          required
          placeholder="Oatmeal with berries"
        />
      </div>
      <div>
        <Label htmlFor="calories">Calories (optional)</Label>
        <Input
          id="calories"
          name="calories"
          type="number"
          inputMode="numeric"
          min="0"
          max="10000"
          placeholder="320"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Homemade" />
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Log meal"}
      </Button>
    </form>
  );
}
