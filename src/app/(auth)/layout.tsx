export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-teal-900">
          NutriTrack
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Your weight, meals, and goals — private to you.
        </p>
      </div>
      <div className="rounded-3xl border border-teal-900/8 bg-white/90 p-5 shadow-lg shadow-teal-900/5">
        {children}
      </div>
    </div>
  );
}
