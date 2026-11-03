import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              NutriTrack Admin
            </p>
            <Link
              href="/admin"
              className="text-lg font-semibold text-slate-900 hover:text-teal-800"
            >
              Patient reports
            </Link>
          </div>
          <Link
            href="/today"
            className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
          >
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
