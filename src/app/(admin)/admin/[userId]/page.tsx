import Link from "next/link";
import { notFound } from "next/navigation";
import { MealPhotoThumb } from "@/components/MealPhotoThumb";
import { Alert, Card, EmptyState, PageHeader } from "@/components/ui";
import {
  getAdminReportsAvailability,
  getPatientDetail,
} from "@/lib/data/admin-reports";
import { formatDisplayDate } from "@/lib/dates";
import {
  formatHeight,
  formatWeight,
  normalizeHeightUnit,
  normalizeWeightUnit,
} from "@/lib/units";

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const availability = await getAdminReportsAvailability();

  if (!availability.supported) {
    return (
      <div>
        <PageHeader title="Patient report" />
        <Alert>{availability.message}</Alert>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-teal-800">
          ← All patients
        </Link>
      </div>
    );
  }

  const detail = await getPatientDetail(userId);
  if (!detail) notFound();

  const { profile, weights, bodies, steps, foods, foodCalorieTotal, foodDaysWithCalories } =
    detail;
  const heightUnit = normalizeHeightUnit(profile.height_unit);
  const weightUnit = normalizeWeightUnit(profile.weight_unit);

  return (
    <div>
      <PageHeader
        title={profile.name}
        subtitle="Read-only patient report"
        action={
          <Link
            href="/admin"
            className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
          >
            All patients
          </Link>
        }
      />

      <Card className="space-y-2">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Email:</span> {profile.email}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Gender:</span>{" "}
          <span className="capitalize">{profile.gender ?? "—"}</span>
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Height:</span>{" "}
          {formatHeight(profile.height_cm, heightUnit)}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Starting / target wt:</span>{" "}
          {formatWeight(profile.starting_weight_kg, weightUnit)} /{" "}
          {formatWeight(profile.target_weight_kg, weightUnit)}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Calorie goal:</span>{" "}
          {profile.daily_calorie_goal ?? "—"}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Joined:</span>{" "}
          {formatDisplayDate(profile.created_at.slice(0, 10))}
        </p>
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Recent weights
        </h2>
        {weights.length === 0 ? (
          <EmptyState>No weight logs.</EmptyState>
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

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Recent measures (in)
        </h2>
        {bodies.length === 0 ? (
          <EmptyState>No body measures.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {bodies.map((log) => (
              <li key={log.id}>
                <Card className="!py-3">
                  <p className="text-sm text-slate-500">
                    {formatDisplayDate(log.logged_on)}
                  </p>
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

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent steps</h2>
        {steps.length === 0 ? (
          <EmptyState>No step logs.</EmptyState>
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

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Recent food
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Shown meals calorie sum:{" "}
          <span className="font-semibold text-slate-800">
            {foodCalorieTotal || "—"}
          </span>
          {foodDaysWithCalories > 0
            ? ` across ${foodDaysWithCalories} day${foodDaysWithCalories === 1 ? "" : "s"}`
            : ""}
        </p>
        {foods.length === 0 ? (
          <EmptyState>No food logs.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {foods.map((meal) => (
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
