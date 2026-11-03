import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listFoodLogs } from "@/lib/data/food";
import { listWeightLogs } from "@/lib/data/weight";
import { formatDisplayDate } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [weights, meals] = await Promise.all([
    listWeightLogs(15),
    listFoodLogs(15),
  ]);

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Recent weight and meal entries."
        action={
          <Link
            href="/today"
            className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
          >
            Today
          </Link>
        }
      />

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Weights</h2>
        {weights.length === 0 ? (
          <EmptyState>No weight history yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {weights.map((log) => (
              <li key={log.id}>
                <Card className="flex items-center justify-between !py-3">
                  <span className="text-sm text-slate-600">
                    {formatDisplayDate(log.logged_on)}
                  </span>
                  <span className="font-semibold text-slate-900">{log.weight_kg} kg</span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Meals</h2>
        {meals.length === 0 ? (
          <EmptyState>No meal history yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {meals.map((meal) => (
              <li key={meal.id}>
                <Card className="!py-3">
                  <p className="text-xs text-slate-500">
                    {formatDisplayDate(meal.logged_on)} · {meal.meal_type}
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="font-medium text-slate-900">{meal.food_name}</p>
                    <p className="shrink-0 text-sm font-semibold text-slate-700">
                      {meal.calories != null ? `${meal.calories} kcal` : "—"}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
