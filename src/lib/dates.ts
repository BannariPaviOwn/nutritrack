export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatShortWeekday(isoDate: string): string {
  return parseISODate(isoDate).toLocaleDateString(undefined, { weekday: "short" });
}

/** Monday–Sunday week containing `isoDate` (ISO calendar week style, good for India). */
export function startOfWeek(isoDate: string): string {
  const date = parseISODate(isoDate);
  const day = date.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

export function endOfWeek(isoDate: string): string {
  const start = parseISODate(startOfWeek(isoDate));
  start.setDate(start.getDate() + 6);
  return toISODate(start);
}

export function listWeekDates(isoDate: string): string[] {
  const start = parseISODate(startOfWeek(isoDate));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISODate(d);
  });
}

export function formatWeekRangeLabel(isoDate: string): string {
  const start = startOfWeek(isoDate);
  const end = endOfWeek(isoDate);
  return `${formatDisplayDate(start)} – ${formatDisplayDate(end)} · Mon–Sun`;
}

export function startOfMonth(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function endOfMonth(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function listMonthDates(isoDate: string): string[] {
  const start = parseISODate(startOfMonth(isoDate));
  const end = parseISODate(endOfMonth(isoDate));
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function formatMonthLabel(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function isDateInRange(isoDate: string, start: string, end: string): boolean {
  return isoDate >= start && isoDate <= end;
}

export type DashboardRange = "day" | "week" | "month";

export function parseDashboardRange(value: string | string[] | undefined): DashboardRange {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "week" || raw === "month") return raw;
  return "day";
}
