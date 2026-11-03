import { AuthForm } from "@/components/AuthForm";
import { dataModeLabel } from "@/lib/mode";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const mode = dataModeLabel();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to continue tracking.</p>
      </div>
      <AuthForm mode="login" />
      {mode === "local" ? (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
          Demo: <span className="font-medium">demo@nutritrack.local</span> / see README
        </p>
      ) : null}
      <p className="text-center text-xs text-slate-500">
        Data mode: {mode === "local" ? "local JSON store" : "Supabase"}
      </p>
    </div>
  );
}
