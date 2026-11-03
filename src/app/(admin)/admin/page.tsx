import Link from "next/link";
import { Alert, Card, EmptyState, PageHeader } from "@/components/ui";
import {
  getAdminReportsAvailability,
  listPatientSummaries,
} from "@/lib/data/admin-reports";
import { formatDisplayDate } from "@/lib/dates";
import {
  formatHeight,
  formatWeight,
  normalizeHeightUnit,
  normalizeWeightUnit,
} from "@/lib/units";

function dash(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

export default async function AdminPatientsPage() {
  const availability = await getAdminReportsAvailability();
  const patients = availability.supported ? await listPatientSummaries() : [];

  return (
    <div>
      <PageHeader
        title="All patients"
        subtitle="Read-only report of every signed-up profile and their latest logs."
      />

      {!availability.supported ? (
        <Alert>{availability.message}</Alert>
      ) : patients.length === 0 ? (
        <EmptyState>No patients yet. Accounts created via Sign up will appear here.</EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            {patients.length} patient{patients.length === 1 ? "" : "s"}
          </p>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {patients.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/${p.id}`}>
                  <Card className="transition hover:border-teal-300">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-600">{p.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {p.gender ? p.gender : "gender —"} · ht{" "}
                      {formatHeight(
                        p.height_cm,
                        normalizeHeightUnit(p.height_unit),
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Wt{" "}
                      {formatWeight(
                        p.latest_weight_kg,
                        normalizeWeightUnit(p.weight_unit),
                      )}{" "}
                      · W/H/T {dash(p.latest_waist_in)}/{dash(p.latest_hip_in)}/
                      {dash(p.latest_thigh_in)} · Steps {dash(p.latest_steps)}
                    </p>
                    <p className="mt-1 text-xs text-teal-800 font-medium">
                      Open report →
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-teal-900/8 bg-white shadow-sm md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Patient</th>
                  <th className="px-3 py-3 font-semibold">Gender</th>
                  <th className="px-3 py-3 font-semibold">Height</th>
                  <th className="px-3 py-3 font-semibold">Latest wt</th>
                  <th className="px-3 py-3 font-semibold">W / H / T</th>
                  <th className="px-3 py-3 font-semibold">Steps</th>
                  <th className="px-3 py-3 font-semibold">Joined</th>
                  <th className="px-3 py-3 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-teal-50/40"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/${p.id}`}
                        className="font-semibold text-teal-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="px-3 py-3 capitalize">{dash(p.gender)}</td>
                    <td className="px-3 py-3">
                      {formatHeight(
                        p.height_cm,
                        normalizeHeightUnit(p.height_unit),
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {formatWeight(
                        p.latest_weight_kg,
                        normalizeWeightUnit(p.weight_unit),
                      )}
                      {p.latest_weight_on ? (
                        <p className="text-xs text-slate-400">
                          {formatDisplayDate(p.latest_weight_on)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {p.latest_body_on
                        ? `${dash(p.latest_waist_in)} / ${dash(p.latest_hip_in)} / ${dash(p.latest_thigh_in)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {p.latest_steps != null
                        ? p.latest_steps.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {p.created_at
                        ? formatDisplayDate(p.created_at.slice(0, 10))
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {p.last_activity_on
                        ? formatDisplayDate(p.last_activity_on.slice(0, 10))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
