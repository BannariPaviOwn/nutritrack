import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { bmiCategory, calcBmi } from "@/lib/bmi";
import { getProfile } from "@/lib/data/profiles";
import { listFoodForDate } from "@/lib/data/food";
import { getWeightForDate } from "@/lib/data/weight";
import { formatDisplayDate, todayISO } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayISO();
  const [profile, weight, meals] = await Promise.all([
    getProfile(),
    getWeightForDate(today),
    listFoodForDate(today),
  ]);

  const calorieSum = meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const hasAnyCalories = meals.some((m) => m.calories != null);
  const bmi =
    weight && profile?.height_cm
      ? calcBmi(weight.weight_kg, profile.height_cm)
      : null;

  return (
    <div>
      <PageHeader
        title={`Hi, ${profile?.name ?? user.name}`}
        subtitle={formatDisplayDate(today)}
        action={
          <Link
            href="/history"
            className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
          >
            History
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Today&apos;s weight
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {weight ? `${weight.weight_kg} kg` : "—"}
          </p>
          {!weight ? (
            <Link href="/weight" className="mt-2 inline-block text-sm font-medium text-teal-800">
              Log weight →
            </Link>
          ) : null}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Calories today
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {hasAnyCalories ? calorieSum : "—"}
          </p>
          {profile?.daily_calorie_goal ? (
            <p className="mt-1 text-sm text-slate-500">
              Goal {profile.daily_calorie_goal} kcal
            </p>
          ) : null}
        </Card>

        <Card className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">BMI</p>
          {bmi != null ? (
            <>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{bmi}</p>
              <p className="mt-1 text-sm text-slate-500">{bmiCategory(bmi)}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Log today&apos;s weight and set height on your profile to see BMI.
            </p>
          )}
        </Card>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s meals</h2>
          <Link href="/food" className="text-sm font-semibold text-teal-800">
            Add meal
          </Link>
        </div>
        {meals.length === 0 ? (
          <EmptyState>No meals logged yet today.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {meals.map((meal) => (
              <li key={meal.id}>
                <Card className="flex items-start justify-between gap-3 !py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      {meal.meal_type}
                    </p>
                    <p className="font-medium text-slate-900">{meal.food_name}</p>
                    {meal.notes ? (
                      <p className="text-sm text-slate-500">{meal.notes}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-700">
                    {meal.calories != null ? `${meal.calories} kcal` : "—"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
