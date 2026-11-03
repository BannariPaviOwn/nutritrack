import Link from "next/link";
import type { DashboardRange } from "@/lib/dates";

const options: { value: DashboardRange; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function RangeToggle({
  range,
  basePath = "/today",
}: {
  range: DashboardRange;
  basePath?: string;
}) {
  return (
    <div
      className="mb-5 inline-flex w-full rounded-xl border border-teal-900/10 bg-white/70 p-1 shadow-sm shadow-teal-900/5"
      role="tablist"
      aria-label="View range"
    >
      {options.map(({ value, label }) => {
        const active = range === value;
        const href = value === "day" ? basePath : `${basePath}?range=${value}`;
        return (
          <Link
            key={value}
            href={href}
            role="tab"
            aria-selected={active}
            className={`flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${
              active
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
