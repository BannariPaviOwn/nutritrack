import { DeleteBodyButton, DeleteStepsButton } from "@/components/DeleteButtons";
import { MeasuresForm } from "@/components/MeasuresForm";
import { StepsForm } from "@/components/StepsForm";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBodyForDate, listBodyLogs } from "@/lib/data/body";
import { getStepsForDate, listStepLogs } from "@/lib/data/steps";
import { formatDisplayDate, todayISO } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function MeasuresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayISO();
  const [logs, todayLog, stepLogs, todaySteps] = await Promise.all([
    listBodyLogs(30),
    getBodyForDate(today),
    listStepLogs(30),
    getStepsForDate(today),
  ]);

  return (
    <div>
      <PageHeader
        title="Measures"
        subtitle="Body inches and daily steps are separate — log either one anytime."
      />

      <Card id="steps">
        <h2 className="text-base font-semibold text-slate-900">Daily steps</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Steps only — no waist, hip, or thigh needed.
        </p>
        <StepsForm defaultDate={today} defaultSteps={todaySteps?.steps} />
      </Card>

      <Card id="body" className="mt-4">
        <h2 className="text-base font-semibold text-slate-900">Body (inches)</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Waist, hip, and thigh — independent from steps.
        </p>
        <MeasuresForm
          defaultDate={today}
          defaults={{
            waist_in: todayLog?.waist_in,
            hip_in: todayLog?.hip_in,
            thigh_in: todayLog?.thigh_in,
          }}
        />
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent measurements</h2>
        {logs.length === 0 ? (
          <EmptyState>No measurements yet. Log waist, hip, and thigh above.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id}>
                <Card className="flex items-start justify-between gap-2 !py-3">
                  <div>
                    <p className="text-sm text-slate-500">{formatDisplayDate(log.logged_on)}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Waist <span className="font-semibold text-slate-900">{log.waist_in}</span> in
                      <span className="mx-1.5 text-slate-300">·</span>
                      Hip <span className="font-semibold text-slate-900">{log.hip_in}</span> in
                      <span className="mx-1.5 text-slate-300">·</span>
                      Thigh{" "}
                      <span className="font-semibold text-slate-900">
                        {log.thigh_in != null ? `${log.thigh_in}` : "—"}
                      </span>
                      {log.thigh_in != null ? " in" : ""}
                    </p>
                  </div>
                  <DeleteBodyButton id={log.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent steps</h2>
        {stepLogs.length === 0 ? (
          <EmptyState>No steps logged yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {stepLogs.map((log) => (
              <li key={log.id}>
                <Card className="flex items-center justify-between gap-2 !py-3">
                  <div>
                    <p className="text-sm text-slate-500">{formatDisplayDate(log.logged_on)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {log.steps.toLocaleString()} steps
                    </p>
                  </div>
                  <DeleteStepsButton id={log.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
