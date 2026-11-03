import { AuthForm } from "@/components/AuthForm";
import { dataModeLabel } from "@/lib/mode";

export default function SignupPage() {
  const mode = dataModeLabel();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Each account keeps weight, height, and food data private.
        </p>
      </div>
      <AuthForm mode="signup" />
      <p className="text-center text-xs text-slate-500">
        Data mode: {mode === "local" ? "local JSON store" : "Supabase"}
      </p>
    </div>
  );
}
