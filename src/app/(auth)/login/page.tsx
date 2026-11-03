import { AuthForm } from "@/components/AuthForm";
import { dataModeLabel } from "@/lib/mode";

export default function LoginPage() {
  const mode = dataModeLabel();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to continue tracking.</p>
      </div>
      <AuthForm mode="login" />
      <p className="text-center text-xs text-slate-500">
        Data mode: {mode === "local" ? "local JSON store" : "Supabase"}
      </p>
    </div>
  );
}
