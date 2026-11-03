export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-28 pt-6 sm:pt-8">
      {children}
    </div>
  );
}
