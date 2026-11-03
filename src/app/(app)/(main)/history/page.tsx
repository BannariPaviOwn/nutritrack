import Link from "next/link";
import { MealPhotoThumb } from "@/components/MealPhotoThumb";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listBodyLogs } from "@/lib/data/body";
import { listFoodLogs } from "@/lib/data/food";
import { getProfile } from "@/lib/data/profiles";
import { listStepLogs } from "@/lib/data/steps";
import { listWeightLogs } from "@/lib/data/weight";
import { formatDisplayDate } from "@/lib/dates";
import { formatWeight, normalizeWeightUnit } from "@/lib/units";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [weights, meals, bodies, steps, profile] = await Promise.all([
    listWeightLogs(15),
    listFoodLogs(15),
    listBodyLogs(15),
    listStepLogs(15),
    getProfile(),
  ]);
  const weightUnit = normalizeWeightUnit(profile?.weight_unit);

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Recent weight, measures, steps, and meals."
        action={
          <Link
            href="/today"
            className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
          >
            Today
          </Link>
        }
      />

      <p className="mb-6 text-sm text-slate-600">
        For day / week / month summaries, use the toggle on{" "}
        <Link href="/today" className="font-semibold text-teal-800">
          Today
        </Link>
        .
      </p>

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
                  <span className="font-semibold text-slate-900">
                    {formatWeight(log.weight_kg, weightUnit)}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Measures (in)</h2>
        {bodies.length === 0 ? (
          <EmptyState>No measurement history yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {bodies.map((log) => (
              <li key={log.id}>
                <Card className="!py-3">
                  <p className="text-sm text-slate-500">{formatDisplayDate(log.logged_on)}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    Waist {log.waist_in} · Hip {log.hip_in} · Thigh{" "}
                    {log.thigh_in != null ? log.thigh_in : "—"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Steps</h2>
        {steps.length === 0 ? (
          <EmptyState>No step history yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {steps.map((log) => (
              <li key={log.id}>
                <Card className="flex items-center justify-between !py-3">
                  <span className="text-sm text-slate-600">
                    {formatDisplayDate(log.logged_on)}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {log.steps.toLocaleString()} steps
                  </span>
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
                  <div className="flex items-start gap-3">
                    <MealPhotoThumb src={meal.photo_url} alt={meal.food_name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        {formatDisplayDate(meal.logged_on)} · {meal.meal_type}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <p className="font-medium text-slate-900">{meal.food_name}</p>
                        <p className="shrink-0 text-sm font-semibold text-slate-700">
                          {meal.calories != null ? `${meal.calories} kcal` : "—"}
                        </p>
                      </div>
                    </div>
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
