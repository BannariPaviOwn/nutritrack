import { DeleteFoodButton } from "@/components/DeleteButtons";
import { FoodForm } from "@/components/FoodForm";
import { MealPhotoThumb } from "@/components/MealPhotoThumb";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listFoodLogs } from "@/lib/data/food";
import { formatDisplayDate, todayISO } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function FoodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const meals = await listFoodLogs(20);

  return (
    <div>
      <PageHeader title="Log food" subtitle="Breakfast, lunch, dinner, or a snack." />
      <Card>
        <FoodForm defaultDate={todayISO()} />
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent meals</h2>
        {meals.length === 0 ? (
          <EmptyState>No meals yet. Log your first one above.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {meals.map((meal) => (
              <li key={meal.id}>
                <Card className="flex items-start justify-between gap-2 !py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <MealPhotoThumb src={meal.photo_url} alt={meal.food_name} />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {formatDisplayDate(meal.logged_on)} · {meal.meal_type}
                      </p>
                      <p className="font-medium text-slate-900">{meal.food_name}</p>
                      <p className="text-sm text-slate-600">
                        {meal.calories != null ? `${meal.calories} kcal` : "Calories not set"}
                      </p>
                    </div>
                  </div>
                  <DeleteFoodButton id={meal.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
