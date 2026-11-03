import { DeleteWeightButton } from "@/components/DeleteButtons";
import { WeightForm } from "@/components/WeightForm";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listWeightLogs } from "@/lib/data/weight";
import { formatDisplayDate, todayISO } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function WeightPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await listWeightLogs(20);

  return (
    <div>
      <PageHeader title="Weight" subtitle="One entry per day — re-saving updates that date." />
      <Card>
        <WeightForm defaultDate={todayISO()} />
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent weights</h2>
        {logs.length === 0 ? (
          <EmptyState>No weight entries yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id}>
                <Card className="flex items-center justify-between gap-2 !py-3">
                  <div>
                    <p className="text-sm text-slate-500">{formatDisplayDate(log.logged_on)}</p>
                    <p className="text-lg font-semibold text-slate-900">{log.weight_kg} kg</p>
                  </div>
                  <DeleteWeightButton id={log.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
