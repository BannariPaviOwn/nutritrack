import Link from "next/link";
import { MealPhotoThumb } from "@/components/MealPhotoThumb";
import { RangeToggle } from "@/components/RangeToggle";
import { StepsForm } from "@/components/StepsForm";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { bmiCategory, calcBmi } from "@/lib/bmi";
import { getBodyForDate, listBodyInRange } from "@/lib/data/body";
import { listFoodForDate, listFoodInRange } from "@/lib/data/food";
import { getProfile } from "@/lib/data/profiles";
import { getStepsForDate, listStepsInRange } from "@/lib/data/steps";
import { getWeightForDate, listWeightInRange } from "@/lib/data/weight";
import {
  endOfMonth,
  endOfWeek,
  formatDisplayDate,
  formatMonthLabel,
  formatShortWeekday,
  formatWeekRangeLabel,
  listMonthDates,
  listWeekDates,
  parseDashboardRange,
  startOfMonth,
  startOfWeek,
  todayISO,
  type DashboardRange,
} from "@/lib/dates";
import type { BodyLog, FoodLog, StepLog, WeightLog, WeightUnit } from "@/lib/types";
import {
  formatWeight,
  normalizeWeightUnit,
  toDisplayWeight,
} from "@/lib/units";
import { redirect } from "next/navigation";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function calorieTotal(meals: FoodLog[]): { sum: number; hasAny: boolean } {
  const hasAny = meals.some((m) => m.calories != null);
  const sum = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  return { sum, hasAny };
}

function mealsByDate(meals: FoodLog[]): Map<string, FoodLog[]> {
  const map = new Map<string, FoodLog[]>();
  for (const meal of meals) {
    const list = map.get(meal.logged_on) ?? [];
    list.push(meal);
    map.set(meal.logged_on, list);
  }
  return map;
}

function weightByDate(weights: WeightLog[]): Map<string, WeightLog> {
  return new Map(weights.map((w) => [w.logged_on, w]));
}

function bodyByDate(bodies: BodyLog[]): Map<string, BodyLog> {
  return new Map(bodies.map((b) => [b.logged_on, b]));
}

function stepsByDate(steps: StepLog[]): Map<string, StepLog> {
  return new Map(steps.map((s) => [s.logged_on, s]));
}

function formatSteps(n: number): string {
  return n.toLocaleString();
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const today = todayISO();
  const profile = await getProfile();

  return (
    <div>
      <PageHeader
        title={`Hi, ${profile?.name ?? user.name}`}
        subtitle={
          range === "day"
            ? formatDisplayDate(today)
            : range === "week"
              ? formatWeekRangeLabel(today)
              : formatMonthLabel(today)
        }
        action={
          <Link
            href="/history"
            className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
          >
            History
          </Link>
        }
      />

      <RangeToggle range={range} />

      {range === "day" ? (
        <DayView
          today={today}
          profileHeight={profile?.height_cm ?? null}
          calorieGoal={profile?.daily_calorie_goal ?? null}
          weightUnit={normalizeWeightUnit(profile?.weight_unit)}
        />
      ) : range === "week" ? (
        <PeriodView
          range="week"
          anchor={today}
          calorieGoal={profile?.daily_calorie_goal ?? null}
          weightUnit={normalizeWeightUnit(profile?.weight_unit)}
        />
      ) : (
        <PeriodView
          range="month"
          anchor={today}
          calorieGoal={profile?.daily_calorie_goal ?? null}
          weightUnit={normalizeWeightUnit(profile?.weight_unit)}
        />
      )}
    </div>
  );
}

async function DayView({
  today,
  profileHeight,
  calorieGoal,
  weightUnit,
}: {
  today: string;
  profileHeight: number | null;
  calorieGoal: number | null;
  weightUnit: WeightUnit;
}) {
  const [weight, meals, body, steps] = await Promise.all([
    getWeightForDate(today),
    listFoodForDate(today),
    getBodyForDate(today),
    getStepsForDate(today),
  ]);

  const { sum: calorieSum, hasAny: hasAnyCalories } = calorieTotal(meals);
  const bmi =
    weight && profileHeight ? calcBmi(weight.weight_kg, profileHeight) : null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Today&apos;s weight
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {weight ? formatWeight(weight.weight_kg, weightUnit) : "—"}
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
          {calorieGoal ? (
            <p className="mt-1 text-sm text-slate-500">Goal {calorieGoal} kcal</p>
          ) : null}
        </Card>

        <Card className="sm:col-span-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Steps today
            </p>
            <Link href="/measures#steps" className="text-sm font-semibold text-teal-800">
              History →
            </Link>
          </div>
          {steps ? (
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatSteps(steps.steps)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Not logged yet — steps only, no body measures.</p>
          )}
          <div className="mt-3">
            <StepsForm defaultDate={today} defaultSteps={steps?.steps} />
          </div>
        </Card>

        <Card>
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

        <Card className="sm:col-span-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Body measures (in)
            </p>
            <Link href="/measures#body" className="text-sm font-semibold text-teal-800">
              {body ? "Edit" : "Log"} →
            </Link>
          </div>
          {body ? (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-500">Waist</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{body.waist_in}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Hip</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{body.hip_in}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Thigh</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {body.thigh_in != null ? body.thigh_in : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No waist / hip / thigh logged for today.
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
                  <div className="flex min-w-0 items-start gap-3">
                    <MealPhotoThumb src={meal.photo_url} alt={meal.food_name} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                        {meal.meal_type}
                      </p>
                      <p className="font-medium text-slate-900">{meal.food_name}</p>
                      {meal.notes ? (
                        <p className="text-sm text-slate-500">{meal.notes}</p>
                      ) : null}
                    </div>
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
    </>
  );
}

async function PeriodView({
  range,
  anchor,
  calorieGoal,
  weightUnit,
}: {
  range: Exclude<DashboardRange, "day">;
  anchor: string;
  calorieGoal: number | null;
  weightUnit: WeightUnit;
}) {
  const start = range === "week" ? startOfWeek(anchor) : startOfMonth(anchor);
  const end = range === "week" ? endOfWeek(anchor) : endOfMonth(anchor);
  const dates = range === "week" ? listWeekDates(anchor) : listMonthDates(anchor);

  const [weights, meals, bodies, stepLogs] = await Promise.all([
    listWeightInRange(start, end),
    listFoodInRange(start, end),
    listBodyInRange(start, end),
    listStepsInRange(start, end),
  ]);

  const wMap = weightByDate(weights);
  const mMap = mealsByDate(meals);
  const bMap = bodyByDate(bodies);
  const sMap = stepsByDate(stepLogs);

  const avgWeightKg = avg(weights.map((w) => w.weight_kg));
  const avgWeight =
    avgWeightKg != null ? toDisplayWeight(avgWeightKg, weightUnit) : null;
  const { sum: totalCalories, hasAny: hasCalories } = calorieTotal(meals);
  const daysWithCalories = new Set(
    meals.filter((m) => m.calories != null).map((m) => m.logged_on),
  ).size;
  const dailyCalAvg =
    hasCalories && daysWithCalories > 0
      ? Math.round(totalCalories / daysWithCalories)
      : null;

  const avgWaist = avg(bodies.map((b) => b.waist_in));
  const avgHip = avg(bodies.map((b) => b.hip_in));
  const thighValues = bodies
    .map((b) => b.thigh_in)
    .filter((v): v is number => v != null);
  const avgThigh = avg(thighValues);

  const totalSteps = stepLogs.reduce((sum, s) => sum + s.steps, 0);
  const daysWithSteps = stepLogs.length;
  const avgSteps =
    daysWithSteps > 0 ? Math.round(totalSteps / daysWithSteps) : null;

  const daysWithWeight = weights.length;
  const daysWithMeals = mMap.size;
  const daysWithBody = bodies.length;
  const dayCount = dates.length;

  const maxCal = Math.max(
    1,
    ...dates.map((d) => {
      const dayMeals = mMap.get(d) ?? [];
      return calorieTotal(dayMeals).sum;
    }),
  );

  const periodLabel = range === "week" ? "This week" : "This month";
  const daysWithData = dates.filter(
    (d) => wMap.has(d) || mMap.has(d) || bMap.has(d) || sMap.has(d),
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Avg weight
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {avgWeight != null ? `${avgWeight} ${weightUnit}` : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {daysWithWeight}/{dayCount} days logged
          </p>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Calories {range === "week" ? "this week" : "this month"}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {hasCalories ? totalCalories : "—"}
          </p>
          {dailyCalAvg != null ? (
            <p className="mt-1 text-sm text-slate-500">
              ~{dailyCalAvg} kcal/day
              {calorieGoal ? ` · goal ${calorieGoal}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              {daysWithMeals}/{dayCount} days with meals
            </p>
          )}
        </Card>

        <Card className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Steps · {daysWithSteps}/{dayCount} days
          </p>
          {stepLogs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No steps logged {range === "week" ? "this week" : "this month"}.{" "}
              <Link href="/measures#steps" className="font-semibold text-teal-800">
                Log steps →
              </Link>
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatSteps(totalSteps)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Daily avg</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {avgSteps != null ? formatSteps(avgSteps) : "—"}
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Avg measures (in) · {daysWithBody}/{dayCount} days
          </p>
          {bodies.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No waist / hip / thigh logged {range === "week" ? "this week" : "this month"}.{" "}
              <Link href="/measures#body" className="font-semibold text-teal-800">
                Log measures →
              </Link>
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-500">Waist</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {avgWaist ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Hip</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {avgHip ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Thigh</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {avgThigh ?? "—"}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {periodLabel} day by day
        </h2>
        {range === "month" && daysWithData.length === 0 ? (
          <EmptyState>No weight, meals, measures, or steps logged this month.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {(range === "month" ? daysWithData : dates).map((date) => {
              const w = wMap.get(date);
              const dayMeals = mMap.get(date) ?? [];
              const b = bMap.get(date);
              const s = sMap.get(date);
              const { sum: cals, hasAny } = calorieTotal(dayMeals);
              const barPct = hasAny ? Math.round((cals / maxCal) * 100) : 0;
              const isToday = date === anchor;

              return (
                <li key={date}>
                  <Card className={`!py-3 ${isToday ? "ring-1 ring-teal-600/30" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {range === "week"
                            ? `${formatShortWeekday(date)} ${parseInt(date.slice(8), 10)}`
                            : formatDisplayDate(date)}
                          {isToday ? (
                            <span className="ml-2 text-xs font-medium text-teal-700">
                              Today
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {w ? formatWeight(w.weight_kg, weightUnit) : "No weight"}
                          <span className="mx-1.5 text-slate-300">·</span>
                          {hasAny ? `${cals} kcal` : "No calories"}
                          <span className="mx-1.5 text-slate-300">·</span>
                          {s ? `${formatSteps(s.steps)} steps` : "No steps"}
                          <span className="mx-1.5 text-slate-300">·</span>
                          {dayMeals.length} meal{dayMeals.length === 1 ? "" : "s"}
                        </p>
                        {b ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            W {b.waist_in} · H {b.hip_in}
                            {b.thigh_in != null ? ` · T ${b.thigh_in}` : " · T —"} in
                          </p>
                        ) : null}
                      </div>
                      {hasAny ? (
                        <div className="hidden w-16 shrink-0 sm:block" aria-hidden>
                          <div className="h-2 overflow-hidden rounded-full bg-teal-50">
                            <div
                              className="h-full rounded-full bg-teal-600"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {range === "week" ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Meals this week</h2>
            <Link href="/food" className="text-sm font-semibold text-teal-800">
              Add meal
            </Link>
          </div>
          {meals.length === 0 ? (
            <EmptyState>No meals logged this week.</EmptyState>
          ) : (
            <ul className="space-y-4">
              {dates
                .filter((d) => (mMap.get(d) ?? []).length > 0)
                .map((date) => (
                  <li key={date}>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      {formatDisplayDate(date)}
                    </p>
                    <ul className="space-y-2">
                      {(mMap.get(date) ?? []).map((meal) => (
                        <li key={meal.id}>
                          <Card className="flex items-start justify-between gap-3 !py-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <MealPhotoThumb src={meal.photo_url} alt={meal.food_name} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                                  {meal.meal_type}
                                </p>
                                <p className="font-medium text-slate-900">{meal.food_name}</p>
                              </div>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-slate-700">
                              {meal.calories != null ? `${meal.calories} kcal` : "—"}
                            </p>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
